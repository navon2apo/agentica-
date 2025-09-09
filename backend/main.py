from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import uuid4
from datetime import datetime
import os
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import google.generativeai as genai
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow

app = FastAPI(title="Local Agent Backend", version="0.1.0")

# Initialize scheduler
scheduler = AsyncIOScheduler()

# Configure Google Gemini if API key is available
try:
    if os.getenv("GEMINI_API_KEY"):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    print(f"Failed to configure Gemini: {e}")

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
agent_templates: Dict[str, Dict[str, Any]] = {}


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
    segment: Optional[str] = "small_business"
    notes: Optional[str] = None
    call_summary: Optional[str] = None
    custom_field_1: Optional[str] = None
    custom_field_2: Optional[str] = None
    custom_field_3: Optional[str] = None
    custom_field_4: Optional[str] = None
    custom_field_5: Optional[str] = None


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
    return {
        "id": "local-user", 
        "email": "local@example.com",
        "custom_field_1_label": "תעשייה",
        "custom_field_2_label": "גודל חברה", 
        "custom_field_3_label": "מקור הליד",
        "custom_field_4_label": "עדיפות",
        "custom_field_5_label": "הערות נוספות"
    }


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


async def execute_scheduled_task(task_id: str):
    """Execute a scheduled task"""
    if task_id not in tasks:
        return
    
    task = tasks[task_id]
    try:
        print(f"Executing task: {task['task_name']}")
        
        # Update task status
        tasks[task_id]["last_run_status"] = "running"
        tasks[task_id]["updated_date"] = datetime.utcnow()
        
        # Execute the task based on workflow_type
        if task.get("workflow_type") == "prompt":
            # Execute LLM prompt
            response = await invoke_llm({"prompt": task.get("workflow_definition", "")})
            print(f"Task {task_id} LLM response: {response.get('response', '')[:100]}...")
        
        # Mark as completed
        tasks[task_id]["last_run_status"] = "success"
        tasks[task_id]["updated_date"] = datetime.utcnow()
        
    except Exception as e:
        print(f"Task {task_id} failed: {e}")
        tasks[task_id]["last_run_status"] = "failed"
        tasks[task_id]["updated_date"] = datetime.utcnow()

@app.post("/scheduled-tasks/run")
async def run_task_now(body: Dict[str, Any]):
    task_id = body.get("task_id")
    if task_id and task_id in tasks:
        await execute_scheduled_task(task_id)
        return {"success": True, "message": "Task executed"}
    return {"success": False, "message": "Task not found"}


# LLM stub
@app.post("/invoke-llm")
async def invoke_llm(payload: Dict[str, Any]):
    prompt = payload.get("prompt", "")
    
    # Try to use Gemini if configured
    try:
        if os.getenv("GEMINI_API_KEY"):
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            return {
                "response": response.text,
                "tool_to_call": None
            }
    except Exception as e:
        print(f"Gemini error: {e}")
    
    # Fallback to mock response
    return {
        "response": f"(תשובה זמנית) קיבלתי: {prompt[:120]}...",
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


# Agent Templates CRUD
@app.get("/agent-templates", response_model=List[Dict[str, Any]])
def list_agent_templates():
    return list(agent_templates.values())

@app.get("/agent-templates/{template_id}")
def get_agent_template(template_id: str):
    if template_id not in agent_templates:
        raise HTTPException(404, "Template not found")
    return agent_templates[template_id]

@app.post("/agent-templates")
def create_agent_template(payload: Dict[str, Any]):
    now = datetime.utcnow()
    template_id = str(uuid4())
    obj = {**payload, "id": template_id, "created_date": now, "updated_date": now}
    agent_templates[template_id] = obj
    return obj

@app.put("/agent-templates/{template_id}")
def update_agent_template(template_id: str, payload: Dict[str, Any]):
    if template_id not in agent_templates:
        raise HTTPException(404, "Template not found")
    now = datetime.utcnow()
    obj = {**agent_templates[template_id], **payload, "updated_date": now}
    agent_templates[template_id] = obj
    return obj

@app.delete("/agent-templates/{template_id}")
def delete_agent_template(template_id: str):
    agent_templates.pop(template_id, None)
    return {"success": True}

@app.on_event("startup")
async def startup_event():
    """Start the scheduler and load existing tasks"""
    scheduler.start()
    print("Scheduler started")
    
    # Add existing tasks to scheduler
    for task_id, task in tasks.items():
        if task.get("is_active", True):
            try:
                schedule_type = task.get("schedule_type", "daily")
                schedule_time = task.get("schedule_time", "09:00")
                
                if schedule_type == "daily":
                    hour, minute = map(int, schedule_time.split(":"))
                    scheduler.add_job(
                        execute_scheduled_task,
                        CronTrigger(hour=hour, minute=minute),
                        args=[task_id],
                        id=f"task_{task_id}",
                        replace_existing=True
                    )
                    print(f"Scheduled daily task {task_id} at {schedule_time}")
            except Exception as e:
                print(f"Failed to schedule task {task_id}: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop the scheduler"""
    scheduler.shutdown()
    print("Scheduler stopped")

@app.get("/health")
def health():
    return {"ok": True, "scheduler_running": scheduler.running}


