import json
import os
import logging
from typing import Dict

from google import genai
from PyPDF2 import PdfReader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
# Using 1.5 Pro for large context window (2M tokens) logic suitable for legal docs
MODEL_NAME = "gemini-3-flash-preview" 
# Choices: "gemini-3-flash-preview"
def _get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
         logger.warning("GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables.")
         raise RuntimeError("GEMINI_API_KEY not set in environment variables.")
    
    return genai.Client(api_key=api_key)

TEST_PROMPT = """
Role: You are a strict, pedantic Legal Proofreader. You are reviewing a standalone legal document fragment.
Input: The attached text from a contract.

CRITICAL INSTRUCTIONS:
1. **Assume Isolation with Common Sense**: Do NOT assume missing definitions exist in other documents. However, IGNORE common commercial lending terms typically defined in a base Credit Agreement (e.g., "Borrower", "Administrative Agent", "Lender", "Business Day", "Dollars", "GAAP", "Material Adverse Effect"). Only flag specific, deal-specific, or unusual capitalized terms that are undefined.
2. **Logic Check:** Check all math and logic tables.
3. **Drafting Errors:** Find any placeholders like "[__]" or blank lines that were forgotten.

Output Format:
Return ONLY a valid JSON object with the following structure:
{
  "errors": [
    {
      "location": "Page 3, Section 2.1",
      "error": "Description of the error",
      "suggestion": "Suggested fix"
    }
  ]
}
If no errors are found, return {"errors": []}.
"""

def analyze_document(file_path: str) -> Dict:
    try:
        client = _get_client()
        
        with open(file_path, "rb") as f:
            reader = PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        
        if not text.strip():
             return {"errors": [{"location": "Document", "error": "Could not extract text from PDF.", "suggestion": "Ensure PDF is text-based, not scanned image."}]}

        # model = genai.GenerativeModel(MODEL_NAME) # Not needed in V2
        
        logger.info(f"Sending request to Gemini ({MODEL_NAME})... Text length: {len(text)} chars")
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=f"{TEST_PROMPT}\n\n--- CONTRACT TEXT BEGINS ---\n{text}\n--- CONTRACT TEXT ENDS ---",
            config={"response_mime_type": "application/json"}
        )
        
        raw_output = response.text
        logger.info("Received response from Gemini.")

        try:
            data = json.loads(raw_output)
            if isinstance(data, list):
                 # Handle case where model returns list directly
                return {"errors": data}
            if "errors" not in data:
                 # Handle case where model returns json but not matching schema
                 return {"errors": [], "raw_output": data}
            return data
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON: {raw_output}")
            return {
                "errors": [{
                    "location": "System", 
                    "error": "AI returned invalid JSON.", 
                    "suggestion": "Retry analysis."
                }]
            }

    except Exception as e:
        logger.exception("Error analyzing document with Gemini")
        return {
            "errors": [{
                "location": "System",
                "error": f"Analysis failed: {str(e)}",
                "suggestion": "Check system logs and API keys."
            }]
        }
