# Local Frontend + Backend

This is a Vite + React frontend adapted to work with a local FastAPI backend instead of Base44.

## Frontend

```bash
npm install
npm run dev
```

Create a `.env` at the project root with:

```
VITE_API_URL=http://localhost:8000
```

## Backend (FastAPI)

Create a Python environment and install dependencies:

```bash
pip install fastapi uvicorn
```

Run the backend:

```bash
uvicorn backend.main:app --reload --port 8000
```

The backend includes stub endpoints for Agents, Customers, Scheduled Tasks, Google actions, and LLM invocation. Replace in-memory stores with your DB later.