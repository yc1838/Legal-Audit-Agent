"""Main entry point for the legal audit agent."""
from fastapi import FastAPI


app = FastAPI()
@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health_check():
    return {"status": "OK"}

