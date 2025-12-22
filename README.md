# Legal Audit Agent

A Python-based application for analyzing and auditing legal contracts.

## Project Structure

```
legal-audit-agent/
├── app/              # Main application code
├── tools/            # Contract analysis tools
├── schemas/          # Data schemas and models
├── tests/            # Unit tests
├── requirements.txt  # Python dependencies
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Getting Started

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Application

```bash
uvicorn app.main:app --reload --env-file .env
```

### API Usage

Upload and analyze a PDF:

```bash
curl -F "file=@assets/Credit_Agreement.pdf" http://127.0.0.1:8000/analyze
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

### Running Tests

```bash
pytest
```

## Development

- Add dependencies to `requirements.txt`
- Create new tools in `tools/`
- Define schemas in `schemas/`
- Add tests in `tests/`
