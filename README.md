# Legal Audit Agent

A monorepo project for analyzing and auditing legal contracts, featuring a Python backend and a React frontend.

## Project Structure

The project is organized as a monorepo with two main packages:

```
legal-audit-agent/
├── backend/          # FastAPI application (Python)
├── frontend/         # React application (TypeScript)
├── GEMINI.md         # AI context file
├── .gitignore
└── README.md
```

---

## Backend (FastAPI)

### Setup and Installation

All backend commands must be run from the `/backend` directory.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Running the Application

Ensure you are in the `backend` directory and your virtual environment is activated.

```bash
uvicorn app.main:app --reload --env-file .env
```

### Running Tests

```bash
pytest
```

---

## Frontend (React)

All frontend commands must be run from the `/frontend` directory.

### Setup and Installation

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

```bash
npm run dev
```

---

## API Usage

The following examples assume the backend server is running.

### Health Check

```bash
curl http://127.0.0.1:8000/health
```

### Upload and Analyze a PDF

Note: The path to the asset is now relative to the `backend` directory.

```bash
# From the project root
curl -F "file=@backend/assets/Credit_Agreement.pdf" http://127.0.0.1:8000/analyze
```

