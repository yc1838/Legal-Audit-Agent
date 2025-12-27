import os
import sys
from reportlab.pdfgen import canvas

# Ensure we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.contract_analyze import analyze_document

def create_dummy_pdf(filename):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, "This is a test contract.")
    c.drawString(100, 730, "The Borrower shall pay the Lender on the Termination Date.")
    c.drawString(100, 710, "However, the term 'Termination Date' is not defined herein.")
    c.save()
    print(f"Created {filename}")

def test_gemini_integration():
    pdf_path = "test_contract.pdf"
    create_dummy_pdf(pdf_path)
    
    print("Running Gemini analysis...")
    try:
        result = analyze_document(pdf_path)
        print("\n--- Analysis Result ---")
        print(result)
        
        if "errors" in result and result["errors"]:
            print("\nSUCCESS: Gemini returned errors.")
        elif "errors" in result and not result["errors"]:
            print("\nSUCCESS: Gemini ran but found no errors (check prompt if this is expected).")
        else:
             print("\nWARNING: Unexpected result format.")

    except Exception as e:
        print(f"\nFAILURE: {e}")
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
            print(f"\nCleaned up {pdf_path}")

if __name__ == "__main__":
    # Check for API Key
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
         print("ERROR: GEMINI_API_KEY or GOOGLE_API_KEY not set in environment.")
         # Setup guidance
         print("Please export your key: export GEMINI_API_KEY='your_key'")
         sys.exit(1)
         
    test_gemini_integration()
