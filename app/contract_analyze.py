import json
import os
import logging
from typing import Dict

from openai import OpenAI
from openai.types import FileObject as openai_file_object

MODEL = "gpt-5.2-2025-12-11"
logger = logging.getLogger(__name__)


def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)


def upload_contract_file(file_path: str, client: OpenAI) -> openai_file_object:
    """Extract text from a PDF file."""
    if not os.path.isfile(file_path):
        raise ValueError("File does not exist.")
    try:
        with open(file_path, "rb") as f:
            file = client.files.create(file=f, purpose="assistants")
    except Exception as e:
        raise RuntimeError(f"Error uploading file: {e}") from e
    print(f"☑️ File uploaded: {file.id}. File path: {file_path}")
    return file


TEST_PROMPT = """
Role: You are a strict, pedantic Legal Proofreader. You are reviewing a standalone legal document fragment.
Input: The attached PDF (5 pages).

CRITICAL INSTRUCTIONS:
1. **Assume Isolation with Common Sense**: Do NOT assume missing definitions exist in other documents. However, IGNORE common commercial lending terms typically defined in a base Credit Agreement (e.g., "Borrower", "Administrative Agent", "Lender", "Business Day", "Dollars", "GAAP", "Material Adverse Effect"). Only flag specific, deal-specific, or unusual capitalized terms that are undefined (e.g., "Cash Collateralization", "Project Alpha", "Incremental Turnaround Date").
2. **Logic Check:** Check all math and logic tables USING CODE. 
3. **Drafting Errors:** Find any placeholders like "[__]" or blank lines that were forgotten.

Find drafting errors in this text.
Output RAW JSON only. Start your response with [ and end with ]

Output includes:
- Error Type
- Location (Page/Section)
- Why it is an error
- Law reference, if any.
"""


def analyze_document(file_path: str) -> Dict:
    client = _get_client()
    text_file = upload_contract_file(file_path, client=client)
    input_prompt = """
    You are an expert contract lawyer with attention to details ability.

    Analyze all dates in provided contract file and check for any logical errors.

    Focus on:
    - Signature date vs. effective date
    - Consistency of referenced years
    - Obvious copy-paste mistakes (e.g. dates from an old template)

    ** When encounter some number related logic that you need to check (for example if something is in range or bigger, any sort of math formulations or numerical stuff), please use code to run and only rely on the result of that.
    Please return ONLY a JSON object in the following format, with no extra explanation or nice but useless things like thank you:
    {{
    "errors": [
        {{"location": "page 3, paragraph 2", "error": "States 2023 but should be 2024", "suggestion": "Change '2023' to '2024'"}}
    ]
    }}
    If you did not find any error, however, just return:
    {
    "errors": []
    }
    before sending back, double check every single error you found. Find relevant documentations from legit website with relible sources.
    """
    try:
        response = client.responses.create(
            model=MODEL,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_file",
                            "file_id": text_file.id,
                        },
                        {
                            "type": "input_text",
                            "text": TEST_PROMPT,
                        },
                    ]
                }
            ]
        )
    except Exception as e:
        raise RuntimeError(f"Error analyzing document: {e}") from e

    try:
        raw_output = response.output_text
    except AttributeError as e:
        raise RuntimeError(f"Response missing output_text: {response}") from e

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse model output as JSON: %s", raw_output)
        raise RuntimeError(f"Failed to parse response as JSON: {raw_output}") from e

    # Normalize output to a dict with an "errors" list for downstream code.
    if isinstance(data, dict) and "errors" in data:
        return data
    if isinstance(data, list):
        return {"errors": data}
    return {"errors": []}
