import json
import os
import logging
from typing import Dict

from google import genai
from PyPDF2 import PdfReader
from openpyxl import Workbook, load_workbook
from datetime import datetime

# Configure logging
# These logs will be useful for a future UI-based developer log window
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
# We use gemini-3-flash-preview (V2 API) for its efficiency and speed in legal document analysis.
# The V2 SDK (google-genai) is used here for its modern interface.
MODEL_NAME = "gemini-3-flash-preview" 

# Mock data for "Test Mode" to avoid API costs during UI development.
# These examples represent typical legal issues found in commercial contracts.
MOCK_ANALYSIS_RESULT = {
    "errors": [
        {
            "location": "Page 1, Section 1.2",
            "error": "The term 'Effective Date' is capitalized but not defined in this document or the base agreement.",
            "suggestion": "Define 'Effective Date' in the definitions section or refer to the definition in the Credit Agreement."
        },
        {
            "location": "Page 4, Section 5.3",
            "error": "The interest calculation formula appears to have a typo: 'Principal * Rate / 360' is used, but Section 2.1 specifies a 365-day year.",
            "suggestion": "Update the denominator to 365 to maintain consistency with Section 2.1."
        },
        {
            "location": "Page 7, Section 8.1",
            "error": "Placeholder text '[__]' found in the governing law provision.",
            "suggestion": "Specify the jurisdiction (e.g., 'New York')."
        }
    ]
}

def _get_client():
    """Returns a Gemini Client using API keys from environment variables."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
         logger.error("API Key Missing: GEMINI_API_KEY or GOOGLE_API_KEY must be set.")
         raise RuntimeError("GEMINI_API_KEY not set in environment variables.")
    
    return genai.Client(api_key=api_key)

# The prompt defines the AI's persona and strict output requirements.
# It uses a few-shot style instruction to ensure valid JSON format.
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

def _yield_log(level: str, message: str):
    """Utility to yield log objects in a format the frontend expects."""
    from datetime import datetime
    return json.dumps({
        "log": {
            "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
            "level": level,
            "message": f"[{level}] {message}"
        }
    }) + "\n"

def _log_to_excel(model: str, prompt: str, output: str):
    """Logs the analysis session to an Excel file."""
    file_path = "audit_logs.xlsx"
    headers = ["Timestamp", "Model", "Prompt Snippet", "Full Prompt", "Output"]
    
    # Truncate prompt for easier viewing in snippet column
    prompt_snippet = (prompt[:100] + "...") if len(prompt) > 100 else prompt

    try:
        if os.path.exists(file_path):
            wb = load_workbook(file_path)
            ws = wb.active
        else:
            wb = Workbook()
            ws = wb.active
            ws.append(headers)

        ws.append([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            model,
            prompt_snippet,
            prompt,
            output
        ])
        wb.save(file_path)
        logger.info(f"Audit log saved to {file_path}")
    except Exception as e:
        logger.error(f"Failed to save audit log to Excel: {e}")


def analyze_document_generator(file_path: str, test_mode: bool = False):
    """
    Generator that analyzes a PDF and yields status updates and logs.
    """
    filename = os.path.basename(file_path)
    logger.info(f"Starting analysis for: {filename} (Test Mode: {test_mode})")

    yield _yield_log("INFO", f"Initializing analysis pipeline for {filename}")
    yield json.dumps({"stage": "extracting", "message": f"Extracting text from {filename}..."}) + "\n"

    if test_mode:
        yield _yield_log("INFO", "Test Mode is enabled. Intercepting API calls.")
        import time
        
        yield _yield_log("DEBUG", "Simulating PDF text extraction...")
        time.sleep(0.5) 
        yield _yield_log("INFO", "Text extraction complete. Character count: 1240")
        
        yield json.dumps({"stage": "distributing", "message": "Topic Distributor: Routing to Legal Reviewer Agent..."}) + "\n"
        yield _yield_log("INFO", "Topic Distributor selected: legal_reviewer_v1")
        
        time.sleep(1) 
        yield json.dumps({"stage": "analyzing", "message": "Legal Reviewer: Auditing contract logic..."}) + "\n"
        yield _yield_log("INFO", "Legal Reviewer sent content to Gemini Pro model...")
        
        time.sleep(1) 
        yield _yield_log("DEBUG", "Gemini returned raw JSON. Validating schema...")
        yield json.dumps({"stage": "finalizing", "message": "Finalizing report..."}) + "\n"
        
        time.sleep(0.5)
        yield _yield_log("INFO", "Analysis successfully completed.")
        yield json.dumps({"result": MOCK_ANALYSIS_RESULT}) + "\n"
        return

    try:
        yield _yield_log("INFO", "Initializing Gemini 2.0 Flash client...")
        client = _get_client()
        
        try:
            yield _yield_log("DEBUG", f"Opening file stream: {file_path}")
            with open(file_path, "rb") as f:
                try:
                    reader = PdfReader(f)
                    text = ""
                    page_count = len(reader.pages)
                    yield _yield_log("INFO", f"PDF loaded. Total pages discovered: {page_count}")
                    
                    for i, page in enumerate(reader.pages):
                        extracted = page.extract_text() or ""
                        # Insert a clear page marker so the AI handles cross-page text correctly
                        text += f"\n\n--- [START OF PAGE {i+1}] ---\n"
                        text += extracted
                        yield _yield_log("DEBUG", f"Page {i+1} processed. ({len(extracted)} chars)")
                except Exception as pdf_err:
                     yield _yield_log("ERROR", f"PDF Read Error: {str(pdf_err)}")
                     yield json.dumps({"result": {"errors": [{"location": "Document", "error": f"Corrupt or unreadable PDF: {str(pdf_err)}", "suggestion": "Try repairing the PDF or export it again."}]}}) + "\n"
                     return
        
            if not text.strip():
                 yield _yield_log("ERROR", "Extraction failed. PDF text layer is empty.")
                 yield json.dumps({"result": {"errors": [{"location": "Document", "error": "Could not extract text from PDF.", "suggestion": "Ensure PDF is text-based, not scanned image."}]}}) + "\n"
                 return
        except Exception as e:
            # Catch file access errors (though less likely with tempfile)
            yield _yield_log("ERROR", f"File Access Error: {str(e)}")
            raise e

        yield _yield_log("INFO", f"Extraction successful. Total content: {len(text)} characters.")
        
        yield json.dumps({"stage": "distributing", "message": "Topic Distributor: Parsing sections and routing tasks..."}) + "\n"
        yield _yield_log("INFO", "Analyzing contract metadata and structure...")
        
        yield json.dumps({"stage": "analyzing", "message": "Legal Reviewer: Critiquing contract clauses with Gemini..."}) + "\n"
        yield _yield_log("INFO", f"Sending context window of {len(text)} tokens to Gemini API...")
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=f"{TEST_PROMPT}\n\n--- CONTRACT TEXT BEGINS ---\n{text}\n--- CONTRACT TEXT ENDS ---",
            config={"response_mime_type": "application/json"}
        )
        
        raw_output = response.text
        yield _yield_log("INFO", "Analysis received from Gemini.")
        
        # Log to Excel (Non-test mode only)
        full_prompt = f"{TEST_PROMPT}\n\n--- CONTRACT TEXT BEGINS ---\n{text}\n--- CONTRACT TEXT ENDS ---"
        _log_to_excel(MODEL_NAME, full_prompt, raw_output)
        
        yield _yield_log("DEBUG", f"Raw AI Output snippet: {raw_output[:100]}...")

        yield json.dumps({"stage": "finalizing", "message": "Synthesizing findings into structured report..."}) + "\n"

        try:
            yield _yield_log("DEBUG", "Parsing and normalizing JSON schema...")
            data = json.loads(raw_output)
            
            if isinstance(data, list):
                yield _yield_log("WARNING", "AI returned list without wrapper. Normalizing...")
                yield json.dumps({"result": {"errors": data}}) + "\n"
                return
            
            error_count = len(data.get("errors", []))
            yield _yield_log("INFO", f"Pipeline finished. Found {error_count} potential issues.")
            yield json.dumps({"result": data}) + "\n"
            
        except json.JSONDecodeError as jde:
            yield _yield_log("ERROR", f"JSON Parse Failed: {str(jde)}")
            yield json.dumps({"result": {
                "errors": [{
                    "location": "System", 
                    "error": "AI returned invalid JSON structure.", 
                    "suggestion": "Check logs for raw output or retry analysis."
                }]
            }}) + "\n"

    except Exception as e:
        yield _yield_log("CRITICAL", f"Analysis pipeline crashed: {str(e)}")
        yield json.dumps({"result": {
            "errors": [{
                "location": "System",
                "error": f"Internal process failed: {str(e)}",
                "suggestion": "Check backend logs and API configuration."
            }]
        }}) + "\n"

def analyze_document(file_path: str, test_mode: bool = False) -> Dict:
    """Legacy wrapper for synchronous calls (e.g. tests)."""
    gen = analyze_document_generator(file_path, test_mode)
    last_res = {}
    for item in gen:
        data = json.loads(item)
        if "result" in data:
            last_res = data["result"]
    return last_res
