from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import uuid4
from datetime import datetime

app = FastAPI(title="Local Agent Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# In-memory stores (replace with DB later)
agents: Dict[str, Dict[str, Any]] = {}
customers: Dict[str, Dict[str, Any]] = {}
tasks: Dict[str, Dict[str, Any]] = {}
activities: Dict[str, Dict[str, Any]] = {}


class AgentIn(BaseModel):
    name: str
    personality: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 0.7


class AgentOut(AgentIn):
    id: str
    created_date: datetime
    updated_date: datetime


class CustomerIn(BaseModel):
    name: str
    email: str
    company: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = "lead"


class CustomerOut(CustomerIn):
    id: str
    created_date: datetime
    updated_date: datetime


class ScheduledTaskIn(BaseModel):
    agent_id: str
    task_name: str
    description: Optional[str] = None
    schedule_type: str = Field(default="daily")
    schedule_time: str = Field(default="09:00")
    schedule_day: Optional[int] = 1
    workflow_definition: str
    workflow_type: str = Field(default="prompt")
    tools_to_use: List[str] = Field(default_factory=list)
    webhook_trigger: bool = False
    next_run_at: Optional[str] = None
    last_run_status: Optional[str] = "pending"
    is_active: bool = True


class ScheduledTaskOut(ScheduledTaskIn):
    id: str
    created_date: datetime
    updated_date: datetime


@app.get("/auth/me")
def auth_me():
    return {"id": "local-user", "email": "local@example.com"}


# Agents CRUD
@app.get("/agents", response_model=List[AgentOut])
def list_agents():
    return list(agents.values())


@app.get("/agents/{agent_id}", response_model=AgentOut)
def get_agent(agent_id: str):
    if agent_id not in agents:
        raise HTTPException(404, "Agent not found")
    return agents[agent_id]


@app.post("/agents", response_model=AgentOut)
def create_agent(payload: AgentIn):
    now = datetime.utcnow()
    agent_id = str(uuid4())
    obj = {**payload.dict(), "id": agent_id, "created_date": now, "updated_date": now}
    agents[agent_id] = obj
    return obj


@app.put("/agents/{agent_id}", response_model=AgentOut)
def update_agent(agent_id: str, payload: AgentIn):
    if agent_id not in agents:
        raise HTTPException(404, "Agent not found")
    now = datetime.utcnow()
    obj = {**agents[agent_id], **payload.dict(), "updated_date": now}
    agents[agent_id] = obj
    return obj


@app.delete("/agents/{agent_id}")
def delete_agent(agent_id: str):
    agents.pop(agent_id, None)
    return {"success": True}


# Customers
@app.get("/customers", response_model=List[CustomerOut])
def list_customers():
    return list(customers.values())


@app.get("/customers/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str):
    if customer_id not in customers:
        raise HTTPException(404, "Customer not found")
    return customers[customer_id]


@app.post("/customers", response_model=CustomerOut)
def create_customer(payload: CustomerIn):
    now = datetime.utcnow()
    customer_id = str(uuid4())
    obj = {**payload.dict(), "id": customer_id, "created_date": now, "updated_date": now}
    customers[customer_id] = obj
    return obj


@app.put("/customers/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: str, payload: CustomerIn):
    if customer_id not in customers:
        raise HTTPException(404, "Customer not found")
    now = datetime.utcnow()
    obj = {**customers[customer_id], **payload.dict(), "updated_date": now}
    customers[customer_id] = obj
    return obj


@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: str):
    customers.pop(customer_id, None)
    return {"success": True}


@app.post("/customers/search", response_model=List[CustomerOut])
def search_customers(filter: Dict[str, Any]):
    results: List[Dict[str, Any]] = list(customers.values())
    for key, value in filter.items():
        if value is None:
            continue
        v = str(value).lower()
        results = [c for c in results if str(c.get(key, "")).lower().find(v) != -1]
    return results


# Scheduled Tasks
@app.get("/scheduled-tasks", response_model=List[ScheduledTaskOut])
def list_tasks():
    return list(tasks.values())


@app.get("/scheduled-tasks/{task_id}", response_model=ScheduledTaskOut)
def get_task(task_id: str):
    if task_id not in tasks:
        raise HTTPException(404, "Task not found")
    return tasks[task_id]


@app.post("/scheduled-tasks", response_model=ScheduledTaskOut)
def create_task(payload: ScheduledTaskIn):
    now = datetime.utcnow()
    task_id = str(uuid4())
    obj = {**payload.dict(), "id": task_id, "created_date": now, "updated_date": now}
    tasks[task_id] = obj
    return obj


@app.put("/scheduled-tasks/{task_id}", response_model=ScheduledTaskOut)
def update_task(task_id: str, payload: ScheduledTaskIn):
    if task_id not in tasks:
        raise HTTPException(404, "Task not found")
    now = datetime.utcnow()
    obj = {**tasks[task_id], **payload.dict(), "updated_date": now}
    tasks[task_id] = obj
    return obj


@app.delete("/scheduled-tasks/{task_id}")
def delete_task(task_id: str):
    tasks.pop(task_id, None)
    return {"success": True}


@app.post("/scheduled-tasks/run")
def run_task(body: Dict[str, Any]):
    task_id = body.get("task_id")
    if task_id and task_id in tasks:
        tasks[task_id]["last_run_status"] = "success"
        tasks[task_id]["updated_date"] = datetime.utcnow()
    return {"success": True, "message": "Task executed (stub)"}


# LLM stub
@app.post("/invoke-llm")
def invoke_llm(payload: Dict[str, Any]):
    prompt = payload.get("prompt", "")
    return {
        "response": f"(תשובת דמה) קיבלתי: {prompt[:120]}...",
        "tool_to_call": None
    }


# Google stubs
@app.post("/google/oauth")
def google_oauth(body: Dict[str, Any]):
    action = body.get("action")
    if action == "check_status":
        return {"connected": True}
    return {"success": True}


@app.post("/google/gmail")
def gmail_action(body: Dict[str, Any]):
    action = body.get("action")
    if action == "send_email":
        return {"success": True}
    if action == "search_emails":
        return {"success": True, "emails": []}
    if action == "read_email":
        return {"success": True, "email": {"from": "", "to": "", "subject": "", "body": ""}}
    return {"success": False, "error": "Unknown action"}


@app.post("/google/calendar")
def calendar_action(body: Dict[str, Any]):
    action = body.get("action")
    if action == "create_event":
        return {"success": True}
    if action == "list_events":
        return {"success": True, "events": []}
    if action == "check_availability":
        return {"success": True, "available": True}
    return {"success": False, "error": "Unknown action"}


@app.post("/google/drive")
def drive_action(body: Dict[str, Any]):
    return {"success": True}


@app.post("/google/sheets")
def sheets_action(body: Dict[str, Any]):
    return {"success": True}


@app.post("/google/docs")
def docs_action(body: Dict[str, Any]):
    return {"success": True, "document": {"title": "Demo", "id": "doc-1", "url": "https://example.com", "content": ""}}


@app.get("/health")
def health():
    return {"ok": True}


