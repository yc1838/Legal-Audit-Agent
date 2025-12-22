"""Basic tests for the legal audit agent."""

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_analyze_pdf_success(monkeypatch, tmp_path):
    """Upload a PDF and ensure successful analysis response."""

    def fake_analyze_document(file_path):
        return {"errors": [{"location": "page 1", "error": "sample issue"}]}

    monkeypatch.setattr("app.main.analyze_document", fake_analyze_document)

    pdf_path = tmp_path / "sample.pdf"
    pdf_path.write_bytes(b"%PDF-1.4\n% Dummy PDF content\n")

    with pdf_path.open("rb") as f:
        response = client.post(
            "/analyze",
            files={"file": ("sample.pdf", f, "application/pdf")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["file_name"] == "sample.pdf"
    assert body["errors"] == [{"location": "page 1", "error": "sample issue"}]


def test_reject_non_pdf_upload():
    """Reject uploads that are not PDF files."""
    response = client.post(
        "/analyze",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF files are supported."
