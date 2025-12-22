# Gemini Project Context: Legal Document AI Analyst

This document serves as the "source of truth" for the Gemini AI assistant, providing comprehensive context about the project's architecture, technology stack, and coding standards. Adhering to these guidelines is crucial for all code generation, refactoring, and architectural tasks.

## 1. Project Structure & Monorepo Strategy

This project is a monorepo containing both the frontend and backend applications.

### Root Directory Structure:

```
/
├── backend/      # FastAPI (Python) application
├── frontend/     # React + Vite + TypeScript application
└── GEMINI.md     # This file
```

### Command Execution Policy:

**Crucial:** All terminal commands (e.g., `npm install`, `pip install`, `npm run dev`, `uvicorn main:app`) **must** be executed from within their respective sub-directories (`/backend` or `/frontend`). Do not run commands from the root directory unless explicitly using a tool like Docker that manages workspaces.

## 2. Tech Stack & Standards (Strict Adherence)

### Frontend:

*   **Framework**: React with Vite for bundling.
*   **Language**: TypeScript (strict mode).
*   **UI Components**: **shadcn/ui** is the primary component library. Do not use other libraries like Material-UI or Bootstrap.
*   **Styling**: **Tailwind CSS**. All styling must be done via utility classes.
*   **Icons**: **Lucide React**.
*   **PDF Viewing (Future)**: `react-pdf` will be used for in-browser PDF rendering.
*   **Overall Aesthetic**: The UI must have a "Mac-like" feel. It should be clean, minimalist, and incorporate elements of **glassmorphism**. The primary font should be **Inter**.

### Backend:

*   **Framework**: FastAPI.
*   **Language**: Python 3.10 or newer.
*   **Data Validation**: Pydantic for all data models and API schemas.

## 3. Feature Roadmap & Architecture

The application is a "Legal Document AI Analyst" that detects errors and inconsistencies in uploaded legal documents.

### Phase 1: MVP (Current Focus)

1.  **UI**: A simple, clean drag-and-drop interface for uploading a single document (PDF or from a URL).
2.  **Backend Process**: The FastAPI backend receives the document, analyzes it, and identifies potential errors.
3.  **Data Structure**: The backend returns a JSON object containing a list of identified errors. Each error object **must** be structured to support future highlighting functionality.
    ```json
    {
      "errors": [
        {
          "id": "err-001",
          "description": "Clause 4.1 contains conflicting payment terms.",
          "severity": "High",
          "page": 2,
          "location": {
            "x": 100, // x-coordinate
            "y": 250, // y-coordinate
            "width": 300,
            "height": 50
          }
        }
      ]
    }
    ```
4.  **Frontend Display**: The frontend receives the JSON and displays the errors in a simple, scrollable list view.

### Phase 2: Split-Screen View (Future)

*   The UI will evolve into a split-screen layout.
*   **Left Pane**: A full PDF viewer rendered using `react-pdf`.
*   **Right Pane**: The list of errors.
*   **Interaction**: Clicking an error in the list will scroll to and highlight the corresponding location in the PDF viewer on the left, using the `location` data from the API response.

**Crucial Prerequisite**: All frontend and backend code written for Phase 1 must be architected with Phase 2 in mind. Data structures must include location coordinates from day one, and frontend components should be modular to allow for easy replacement of the "Upload View" with the "Split-Screen View" without a major refactor.

## 4. Coding Guidelines

### General:

*   **Strict Typing**: All code must be strictly typed. Use TypeScript interfaces on the frontend and Pydantic models on the backend.
*   **Modularity**: Keep components and functions small, focused, and reusable.

### Frontend:

*   **Components**: Use **Functional Components** and **React Hooks**. Do not use class-based components.
*   **API Communication**: All communication with the backend API must be handled in a dedicated service layer, typically a file at `frontend/src/services/api.ts`. Use `axios` or `fetch` within this file. Do not make direct API calls from within UI components.
*   **State Management**: For simple state, use `useState` and `useContext`. For more complex global state, a simple store like Zustand is preferred.
*   **Error Handling**: The UI must gracefully handle API errors (e.g., failed uploads, analysis errors). Display clear, user-friendly error messages and do not let the application crash.

### Backend:

*   **API Design**: Follow RESTful principles. Use clear and consistent naming for endpoints.
*   **Separation of Concerns**: Business logic should be separated from the API routing layer. Use a service or repository pattern where appropriate.
