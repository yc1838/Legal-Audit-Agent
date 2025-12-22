"""Main entry point for the legal audit agent."""
import logging
import os
import shutil
import tempfile
import uuid
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.contract_analyze import analyze_document

logger = logging.getLogger(__name__)


class AnalyzeResponse(BaseModel):
    file_name: str
    errors: List[dict]


app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/health")
async def health_check():
    return {"status": "OK"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_contract(file: UploadFile = File(...)):
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

        result = analyze_document(temp_path)
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
