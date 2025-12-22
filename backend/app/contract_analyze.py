import json
import os
import logging
from typing import Dict

from openai import OpenAI
from PyPDF2 import PdfReader

MODEL = "gpt-4-turbo-preview"
logger = logging.getLogger(__name__)


def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)


TEST_PROMPT = """
Role: You are a strict, pedantic Legal Proofreader. You are reviewing a standalone legal document fragment.
Input: The attached PDF.

CRITICAL INSTRUCTIONS:
1. **Assume Isolation with Common Sense**: Do NOT assume missing definitions exist in other documents. However, IGNORE common commercial lending terms typically defined in a base Credit Agreement (e.g., "Borrower", "Administrative Agent", "Lender", "Business Day", "Dollars", "GAAP", "Material Adverse Effect"). Only flag specific, deal-specific, or unusual capitalized terms that are undefined (e.g., "Cash Collateralization", "Project Alpha", "Incremental Turnaround Date").
2. **Logic Check:** Check all math and logic tables USING CODE. 
3. **Drafting Errors:** Find any placeholders like "[__]" or blank lines that were forgotten.

Find drafting errors in this text.
Your response must be a valid JSON object and nothing else. Do not include any text before or after the JSON object.

The JSON object should be an array of error objects, where each object has the following fields:
- "location": string (e.g., "Page 3, Section 2.1")
- "error": string (a description of the error)
- "suggestion": string (a suggested fix)

Example of a valid response:
[
  {
    "location": "Page 3, Section 2.1",
    "error": "Undefined term 'Incremental Turnaround Date'",
    "suggestion": "Define the term 'Incremental Turnaround Date' or remove the reference."
  }
]
"""


def analyze_document(file_path: str) -> Dict:
    client = _get_client()
    try:
        with open(file_path, "rb") as f:
            reader = PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": f"{TEST_PROMPT}\n\nContract Content:\n{text}",
                }
            ],
        )
    except Exception as e:
        raise RuntimeError(f"Error analyzing document: {e}") from e

    try:
        raw_output = response.choices[0].message.content
    except (AttributeError, IndexError) as e:
        raise RuntimeError(f"Response missing output_text: {response}") from e

    try:
        if raw_output is None:
            raise RuntimeError("Response content is null")
        data = json.loads(raw_output)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse model output as JSON: %s", raw_output)
        raise RuntimeError(f"Failed to parse response as JSON: {raw_output}") from e

    # Normalize output to a dict with an "errors" list for downstream code.
    if isinstance(data, dict) and "errors" in data:
        # This case is for when the model returns a dict with an "errors" key
        return data
    if isinstance(data, list):
        # This case is for when the model returns a list of errors directly
        return {"errors": data}
    return {"errors": []}
