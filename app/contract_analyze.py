from openai import OpenAI
from openai.types import FileObject as openai_file_object
import os
import json

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

client = OpenAI(api_key=OPENAI_API_KEY)
PATH = "assets/Credit_Agreement.pdf"

if not PATH:
    raise ValueError("Please set PATH to a valid PDF file path.")

def upload_contract_file(file_path) -> openai_file_object:
    """Extract text from a PDF file."""
    try:
        with open(file_path, "rb") as f:
            file = client.files.create(file=f, purpose="assistants")
    except Exception as e:
        print(f"Error uploading file: {e}")
        return None
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

def analyze_document(file_path):
    text_file = upload_contract_file(file_path)
    if not text_file:
        return None
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
            model="gpt-5.2-2025-12-11", # o4-mini
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
        print(f"Error analyzing document: {e}")
        return None
    
    print("response:\n")
    try:
        data = json.loads(response.output_text)
    except json.JSONDecodeError as e:
        print("Failed to parse response as JSON:", e)
        print("Raw output_text:", response.output_text)
        return None
    
    print(data)
    return data


result = analyze_document(PATH)
