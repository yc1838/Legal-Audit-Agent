"""Main entry point for the legal audit agent."""
import logging
import os
import shutil
import tempfile
import uuid
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.contract_analyze import analyze_document, analyze_document_generator, _get_gemini_client

import subprocess
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class AnalyzeResponse(BaseModel):
    file_name: str
    errors: List[dict]


app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/health")
async def health_check():
    return {"status": "OK"}


@app.post("/analyze-contract-stream/")
async def analyze_contract_stream(file: UploadFile = File(...), test_mode: bool = False, model: str = "gemini-2.5-flash"):
    """Upload a PDF and run contract analysis with real-time status updates."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported.")

    temp_dir = tempfile.mkdtemp(prefix="legal-audit-")
    _, ext = os.path.splitext(file.filename)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}{ext or '.pdf'}")

    async def event_generator():
        try:
            contents = await file.read()
            with open(temp_path, "wb") as out_file:
                out_file.write(contents)

            # analyze_document_generator yields JSON strings
            async for stage_data in analyze_document_generator(temp_path, test_mode=test_mode, model=model):
                yield f"{stage_data}\n"
        except Exception as e:
            logger.exception("Streaming analysis failed")
            yield json.dumps({"result": {"errors": [{"location": "System", "error": str(e), "suggestion": "Check logs"}]}}) + "\n"
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


class GitSyncResponse(BaseModel):
    status: str
    message: str

class ADHDDumpRequest(BaseModel):
    content: str

@app.post("/api/git/sync")
async def git_sync():
    """Summarizes changes using Gemini, commits, and pushes to origin/dev."""
    try:
        # 0. Determine project root (2 levels up from backend/app/main.py -> backend/app -> backend -> root)
        # Actually main.py is in backend/app/, so .. is backend, ../.. is legal-audit-agent
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

        # 1. Stage all changes first (including untracked files) - FROM PROJECT ROOT
        subprocess.run(["git", "add", "."], cwd=project_root, check=True)

        # 2. Check if there are staged changes to commit
        diff_proc = subprocess.run(["git", "diff", "--cached"], cwd=project_root, capture_output=True, text=True, check=True)
        diff_text = diff_proc.stdout

        if not diff_text.strip():
             return {"status": "success", "message": "Nothing to sync. Your code is already up to date!"}
        
        # 3. Summarize with Gemini using the staged diff
        client = _get_gemini_client()
        prompt = f"""
        Role: Senior Software Engineer.
        Task: Write a concise, professional git commit message for the following changes.
        Rules: 
        1. Keep it under 72 characters if possible.
        2. Use the imperative mood (e.g., "Add feature" not "Added feature").
        3. Do not include markdown formatting or quotes.
        
        Changes:
        {diff_text[:5000]} 
        """
        
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=prompt
        )
        commit_message = response.text.strip().split("\n")[0]
        
        # 3. Add, Commit, Push
        # Note: We already staged everything in step 1, but running add again doesn't hurt to be sure.
        subprocess.run(["git", "add", "."], cwd=project_root, check=True)
        subprocess.run(["git", "commit", "-m", commit_message], cwd=project_root, check=True)
        subprocess.run(["git", "push", "origin", "dev"], cwd=project_root, check=True)
        
        return {"status": "success", "message": f"Synced: {commit_message}"}
    except Exception as e:
        logger.exception("Git sync failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/adhd-dump")
async def adhd_dump(request: ADHDDumpRequest):
    """Summarizes a quick thought and appends it to README.md."""
    try:
        if not request.content.strip():
            raise HTTPException(status_code=400, detail="Empty content")

        # 1. Summarize and propose solution with Gemini
        client = _get_gemini_client()
        prompt = f"""
        Role: Efficient Task Manager & System Architect.
        Task: Clean up and structure the following raw thoughts into a professional 'Concern' item and a 'Proposed Systemic Solution'.
        
        CRITICAL RULES:
        1. Return ONLY the markdown bullet points. 
        2. NO introductory text (e.g. "Here are your thoughts").
        3. The 'Solution' MUST focus on how to improve the Agentic AI system, architecture, or prompts to prevent this concern in the future.
        
        Format: 
        * **Concern:** [Cleaned up concern]
        * **Systemic Fix:** [System/Architecture improvement]
        
        Input:
        {request.content}
        """
        
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=prompt
        )
        structured_note = response.text.strip()

        # 2. Append to README.md
        readme_path = os.path.join(os.path.dirname(__file__), "..", "..", "README.md")
        with open(readme_path, "a") as f:
            f.write(f"\n\n### ADHD Dump Case Log ({datetime.now().strftime('%Y-%m-%d %H:%M')})\n")
            f.write(f"{structured_note}\n")
        
        return {"status": "success", "note": structured_note}
    except Exception as e:
        logger.exception("ADHD dump failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-contract/", response_model=AnalyzeResponse)
async def analyze_contract(file: UploadFile = File(...), test_mode: bool = False, model: str = "gemini-2.5-flash"):
    """Upload a PDF and run contract analysis."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported.")

    temp_dir = tempfile.mkdtemp(prefix="legal-audit-")
    _, ext = os.path.splitext(file.filename)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}{ext or '.pdf'}")

    try:
        contents = await file.read()
        with open(temp_path, "wb") as out_file:
            out_file.write(contents)

        result = await analyze_document(temp_path, test_mode=test_mode, model=model)
        if not isinstance(result, dict):
            raise RuntimeError(f"Analysis failed to return a valid result: {result!r}")

        errors = result.get("errors", [])
        return AnalyzeResponse(file_name=file.filename, errors=errors)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception("Analysis failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
