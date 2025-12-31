import pytest
import fitz
import os
import time
from app.pdf_locator import batch_locate_text

# Fixture to create a dummy PDF with known text on specific pages
@pytest.fixture(scope="module")
def sample_pdf():
    filename = "test_swarm.pdf"
    doc = fitz.open()
    
    # Page 1 (0-indexed): Blank
    doc.new_page()
    
    # Page 2: Target text "Effective Date"
    page2 = doc.new_page()
    page2.insert_text((100, 100), "The Effective Date shall be January 1st.")
    
    # Page 3: "Interest Rate"
    page3 = doc.new_page()
    page3.insert_text((100, 200), "The Interest Rate is 5%.")
    
    # Page 4: "Termination Clause"
    page4 = doc.new_page()
    page4.insert_text((50, 50), "Termination on 30 days notice.")
    
    doc.save(filename)
    doc.close()
    
    yield filename
    
    # Cleanup
    if os.path.exists(filename):
        os.remove(filename)

def test_exact_match_found(sample_pdf):
    """Verifies finding text on the correct page."""
    tasks = [{"page": 2, "text": "Effective Date"}]
    results = batch_locate_text(sample_pdf, tasks)
    
    assert len(results) == 1
    assert results[0]["found"] is True
    assert results[0]["page"] == 2
    assert len(results[0]["rects"]) > 0

def test_page_drift_neighbor(sample_pdf):
    """Verifies searching neighbors (Page +/- 1) if not found on target."""
    # Text is on Page 2, but we ask for Page 1 (drift)
    # logic should look at 1, then 0 (nope), then 2 (found!)
    tasks = [{"page": 1, "text": "Effective Date"}]
    results = batch_locate_text(sample_pdf, tasks)
    
    assert len(results) == 1
    assert results[0]["found"] is True
    assert results[0]["page"] == 2 # Corrected page
    assert "Effective Date" in str(results[0])

def test_parallel_execution(sample_pdf):
    """Verifies that batch processing works for multiple items."""
    tasks = [
        {"page": 2, "text": "Effective Date"},
        {"page": 3, "text": "Interest Rate"},
        {"page": 2, "text": "Effective Date"}, # Duplicate task
        {"page": 4, "text": "Termination"}
    ]
    
    start_time = time.time()
    results = batch_locate_text(sample_pdf, tasks)
    duration = time.time() - start_time
    
    assert len(results) == 4
    assert all(r["found"] for r in results)
    # Performance assertion is tricky in unit test, but we check correctness first
    print(f"Batch processed in {duration:.4f}s")
    
def test_graceful_failure(sample_pdf):
    """Verifies response when text truly doesn't exist."""
    tasks = [{"page": 2, "text": "NonExistentGhostText"}]
    results = batch_locate_text(sample_pdf, tasks)
    
    assert len(results) == 1
    assert results[0]["found"] is False
    assert results[0]["rects"] == []

def test_fuzzy_match_fallback(sample_pdf):
    """Verifies finding text with slight differences."""
    # "Interest Rate" is in PDF. We search "Interest   Rate" (extra spaces)
    tasks = [{"page": 3, "text": "Interest   Rate"}]
    results = batch_locate_text(sample_pdf, tasks)
    
    assert len(results) == 1
    assert results[0]["found"] is True
    assert results[0]["page"] == 3
