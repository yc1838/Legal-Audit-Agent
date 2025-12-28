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

4.  Create a `.env` file in the `backend` directory with your Gemini API key:
    ```
    GEMINI_API_KEY="your_key_here"
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
    -   Create a `.env` file with the content `GEMINI_API_KEY="your_key_here"`
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
Uses bad models in testing, but based on current experiences only MODEL = "gpt-5.2-2025-12-11" works the best so far (as of Dec 2025 among OpenAI models) with length legal documents.

## TODOs
### Enable multiple model selections
### Enable developer log on the webpage to help debug, also increase monitoring.
### Specifically and agentically use multiple ai to check if the answer is actually reliable.
### Implement decisions based on kind of paper
### Solve common problems lawyers have with accuracy. Which includes: inconsistent dates(including based on law logically wrong ones), misspelling names, outdated names(from last contract).
```
Also fix the problem that AI constantly look get the definition is missing or not part wrong. Which sounds like will be very hard.
虽然也很可能只是单纯因为把 PDF 做成比较小份去 test 的时候会自然 miss 一些后面的 terms 所以各个 ai 才会 confused.
```
### Create a better UI (do it later, please!!!!!!)
### Add functionality of viewing the PDF, and highlight all the suspected errors
### Add judge agents to improve reliability


### Add functionality of auto-correct, followed by checking with user.
### Add functionality of, change the product to be a completely legal financial contract review product. The lawyer will be able to review contracts on this app, while the systems runs on the background, highlight those for example data consistencies on maybe a right side bar (showing position in right side bar, click when lawyer finish whatever she was focusing on, and then it jumps to the actual position). This is important because i realized 1. legal is so strict there is no way we can completely auto it without any human approval. 2. nobody wants to stare at screen, then if the first one is true, the best way is to make it such a way that it works async without distracting the lawyer, who usually loves focus deep. Of course, I can also choose to let them auto process in batch, so the lawyer can get notification of email when they are reviewed by agent, review all these small mistakes in batch, then focus on something else.
### Translating contracts and auto save as PDF
### For lots of parts where we need to look up the internet for the updated law, because whatever in the existing model might be outdated. So, one agent will be specifically designed for it.

GEMINI开发建议：
A. 解决 "Monitoring" (开发者日志)
你提到 Enable developer log... to help debug。

不要从头写。 推荐集成 LangSmith (LangChain) 或 Phoenix (Arize AI)。

它们能直接可视化你的 Agent 思考过程（Trace），看到是哪一步 Retrieve 错了，或者是哪一步 Prompt 没写好。Hackathon 的评委非常喜欢看这种 "Evaluation" 的证据。

B. 解决 "Accuracy" (测试集)
你需要建立一个 "Golden Set"。

找 5 个典型的有问题合同，人工标出里面的 10 个错误。

每次修改 Prompt 或架构后，自动跑这 5 个合同，看 AI 能抓出几个。如果不做这个自动化测试，你永远不知道改了 Prompt 是变好了还是变坏了。


### ADHD Dump Case Log (2025-12-28 00:30)
* **Concern:** Potential false positive for spelling error "thefinancial" in Page 2, Section 3(a)(iii). Investigation suggests a PDF parsing/rendering issue where a page break separated "the" and "financial," rather than a missing space in the source text.


### ADHD Dump Case Log (2025-12-28 00:33)
* **Concern:** A typographical spacing error on Page 2 where the words "the" and "financial" are concatenated as "thefinancial" within the financial covenants section.
* **Solution:** Edit the text on Page 2 to insert the missing space, ensuring the phrase is correctly rendered as "the financial."
