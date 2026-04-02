import fitz  # PyMuPDF
import logging
import concurrent.futures

logger = logging.getLogger(__name__)

def find_text_on_page(doc, page_num, text_snippet, fuzzy_threshold=0.8):
    """
    Helper to search a single page object for text.
    Returns list of dicts {x, y, width, height, page_width, page_height}.
    """
    try:
        if page_num < 1 or page_num > len(doc):
            return []
            
        page = doc[page_num - 1]
        
        # 1. Exact match
        rects = page.search_for(text_snippet)
        
        # 2. Fuzzy fallback (normalized whitespace)
        if not rects:
            normalized = " ".join(text_snippet.split())
            if normalized != text_snippet:
                rects = page.search_for(normalized)
        
        # 3. Super fuzzy (partial words??) - kept simple for now per plan
        if not rects and len(text_snippet) > 20:
             half = len(text_snippet) // 2
             rects = page.search_for(text_snippet[:half])
        
        results = []
        for rect in rects:
            results.append({
                "x": rect.x0,
                "y": rect.y0,
                "width": rect.width,
                "height": rect.height,
                "page_width": page.rect.width,
                "page_height": page.rect.height,
                "page": page_num # Include page number in result
            })
        return results
    except Exception as e:
        logger.error(f"Page search error {page_num}: {e}")
        return []

def worker_locate_task(pdf_path, task):
    """
    Worker function to process a single location task.
    task: {"page": int, "text": str}
    """
    target_page = task.get("page")
    text = task.get("text")
    if not target_page or not text:
        return {"found": False, "rects": []}

    try:
        # Each thread opens its own doc handle for safety with fitz
        doc = fitz.open(pdf_path)
        
        # Neighborhood Search Strategy: Target -> Target-1 -> Target+1 -> Target-2...
        # Let's do simply: Target, then Neighbors +/- 1, then +/- 2
        # Plan: [0, -1, 1, -2, 2] offsets
        offsets = [0, -1, 1, -2, 2]
        
        found_rects = []
        found_page = -1
        
        for offset in offsets:
            check_page = target_page + offset
            if 1 <= check_page <= len(doc):
                rects = find_text_on_page(doc, check_page, text)
                if rects:
                    found_rects = rects
                    found_page = check_page
                    break # Stop once found (assume first match in neighborhood is correct)
        
        doc.close()
        
        if found_rects:
            return {"found": True, "page": found_page, "rects": found_rects, "original_task": task}
        else:
            return {"found": False, "rects": [], "original_task": task}
            
    except Exception as e:
        logger.error(f"Worker failed for task {task}: {e}")
        return {"found": False, "error": str(e), "original_task": task}

def batch_locate_text(pdf_path: str, tasks: list, max_workers=5):
    """
    Parallel locator using ThreadPoolExecutor.
    
    Args:
        pdf_path: Path to PDF.
        tasks: List of dicts [{"page": int, "text": "foo"}, ...]
        max_workers: Number of threads.
        
    Returns:
        List of result dicts in same order (if mapped correctly) or list of results.
    """
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Map tasks to futures
        future_to_task = {executor.submit(worker_locate_task, pdf_path, t): t for t in tasks}
        
        for future in concurrent.futures.as_completed(future_to_task):
            try:
                data = future.result()
                results.append(data)
            except Exception as exc:
                logger.error(f"Task generated exception: {exc}")
                
    # Note: Results order is not guaranteed by as_completed.
    # Caller should map back using "original_task" or we can blindly return list.
    # For this implementation, we return the list of findings.
    return results

# Legacy single function (wrapper for backward compatibility if needed, 
# but we will update caller to use batch)
def find_text_coordinates(pdf_path: str, page_number: int, text_snippet: str):
    """Legacy wrapper calling batch with 1 task."""
    res = batch_locate_text(pdf_path, [{"page": page_number, "text": text_snippet}], max_workers=1)
    if res and res[0]["found"]:
        return res[0]["rects"]
    return []
