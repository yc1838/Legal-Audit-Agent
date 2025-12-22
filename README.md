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

4.  Create a `.env` file in the `backend` directory with your OpenAI API key:
    ```
    OPENAI_API_KEY="your_key_here"
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

## Final Verification

To run the entire application for verification, follow these steps:

1.  **Start the Backend**:
    -   Navigate to the `backend` directory: `cd backend`
    -   Activate the virtual environment: `source venv/bin/activate`
    -   Install dependencies: `pip install -r requirements.txt`
    -   Create a `.env` file with the content `OPENAI_API_KEY="your_key_here"`
    -   Start the server: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file .env`

2.  **Start the Frontend**:
    -   In a separate terminal, navigate to the `frontend` directory: `cd frontend`
    -   Install dependencies: `npm install`
    -   Start the development server: `npm run dev`

3.  **Test the Application**:
    -   Open your web browser and go to the URL provided by the frontend development server (it will likely be `http://localhost:5173`).
    -   Upload a `.txt` contract file.
    -   Click the "Audit Contract" button.
    -   The analysis from the AI will be displayed in the "Audit results" text area.


## API Usage

The following examples assume the backend server is running.

### Health Check

```bash
curl http://127.0.0.1:8000/health
```

### Upload and Analyze a TXT file

Note: The path to the asset is now relative to the `backend` directory.

```bash
# From the project root
curl -F "file=@/path/to/your/contract.txt" http://127.0.0.1:8000/analyze-contract/
```

### Model choice
Uses bad models in testing, but based on current experiences only MODEL = "gpt-5.2-2025-12-11" works the most well with length legal documents.