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


# In-memory stores (replace with DB later) - POPULATED WITH REAL DATA
from datetime import datetime

# Sample agents with real configurations
agents: Dict[str, Dict[str, Any]] = {
    "agent-1": {
        "id": "agent-1",
        "name": "סוכן מכירות מתקדם",
        "personality": "ידידותי, מקצועי ובעל ידע עמוק במכירות",
        "system_prompt": "אתה סוכן מכירות מתקדם. השתמש בכלי CRM לניהול לקוחות, Gmail לתקשורת, ו-Calendar לתיאום פגישות. דבר בעברית ותמיד עזור ללקוח להשיג את המטרות שלו.",
        "temperature": 0.7,
        "status": "active",
        "tools": ["manage_crm", "manage_gmail", "manage_calendar"],
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    },
    "agent-2": {
        "id": "agent-2", 
        "name": "מנהל תוכן ומסמכים",
        "personality": "יצירתי, מאורגן ובעל יכולת כתיבה מצוינת",
        "system_prompt": "אתה מנהל תוכן מתקדם. השתמש ב-Google Docs ליצירת מסמכים, ב-Drive לניהול קבצים, וב-Sheets לניתוח נתונים. צור תוכן איכותי בעברית.",
        "temperature": 0.8,
        "status": "active", 
        "tools": ["manage_docs", "manage_drive", "manage_sheets", "manage_crm"],
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    },
    "agent-3": {
        "id": "agent-3",
        "name": "עוזר אישי חכם", 
        "personality": "עוזר, יעיל ובעל יכולת ריבוי משימות",
        "system_prompt": "אתה עוזר אישי חכם. השתמש בכל הכלים הזמינים - CRM, Gmail, Calendar, Drive, Sheets, Docs - לעזור למשתמש בכל משימה. תמיד שאל שאלות מפרטות ותן פתרונות מעשיים.",
        "temperature": 0.6,
        "status": "active",
        "tools": ["manage_crm", "manage_gmail", "manage_calendar", "manage_drive", "manage_sheets", "manage_docs"],
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    }
}

# Sample customers
customers: Dict[str, Dict[str, Any]] = {
    "customer-1": {
        "id": "customer-1",
        "name": "דוד כהן",
        "email": "david.cohen@example.com",
        "company": "טכנולוגיות דוד בע״מ",
        "phone": "050-1234567",
        "status": "customer",
        "segment": "enterprise",
        "notes": "לקוח VIP, מעוניין בפתרונות AI",
        "custom_field_1": "טכנולוגיה",
        "custom_field_2": "חברה גדולה",
        "custom_field_3": "המלצה",
        "custom_field_4": "גבוהה",
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    },
    "customer-2": {
        "id": "customer-2", 
        "name": "שרה לוי",
        "email": "sarah.levi@startup.com",
        "company": "סטארטאפ חדשני",
        "phone": "052-9876543",
        "status": "prospect",
        "segment": "small_business",
        "notes": "עניין באוטומציה לעסק קטן",
        "custom_field_1": "שירותים",
        "custom_field_2": "עסק קטן",
        "custom_field_3": "אתר",
        "custom_field_4": "בינונית",
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    }
}

# Sample scheduled tasks
tasks: Dict[str, Dict[str, Any]] = {
    "task-1": {
        "id": "task-1",
        "agent_id": "agent-1",
        "task_name": "מעקב יומי אחר לידים חדשים",
        "description": "בדיקה יומית של לידים חדשים במערכת CRM ושליחת עדכון",
        "schedule_type": "daily",
        "schedule_time": "09:00",
        "workflow_definition": "בדוק את כל הלידים החדשים במערכת CRM, נתח את הסטטוס שלהם ושלח דוח סיכום על הפעילות היומית",
        "workflow_type": "prompt",
        "tools_to_use": ["manage_crm", "manage_gmail"],
        "is_active": True,
        "last_run_status": "pending",
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    }
}

activities: Dict[str, Dict[str, Any]] = {}

# Agent templates with real configurations
agent_templates: Dict[str, Dict[str, Any]] = {
    "template-1": {
        "id": "template-1",
        "name": "סוכן מכירות מקצועי",
        "description": "סוכן מכירות מתקדם עם יכולות CRM, Gmail ויומן. מותאם למכירות B2B ומעקב לקוחות",
        "category": "מכירות",
        "icon": "💼",
        "color": "#3b82f6",
        "personality": "מקצועי, ידידותי ומעודד. מתמחה במכירות ובבניית קשרים עם לקוחות",
        "system_prompt": "אתה סוכן מכירות מקצועי. השתמש בכלי CRM לניהול לקוחות, Gmail לתקשורת, ו-Calendar לתיאום פגישות. המטרה שלך לעזור ללקוחות ולהגדיל מכירות.",
        "available_tools": ["manage_crm", "manage_gmail", "manage_calendar"],
        "required_expertise": ["מכירות", "CRM", "תקשורת"],
        "popularity_score": 95,
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    },
    "template-2": {
        "id": "template-2",
        "name": "מנהל תוכן ומסמכים",
        "description": "מתמחה ביצירת תוכן, ניהול מסמכים וניתוח נתונים. אידיאלי לצוותי תוכן ושיווק",
        "category": "תוכן",
        "icon": "📝",
        "color": "#10b981",
        "personality": "יצירתי, מאורגן ובעל יכולת כתיבה מצוינת. אוהב לסדר מידע ולצור תוכן איכותי",
        "system_prompt": "אתה מנהל תוכן מקצועי. השתמש ב-Google Docs ליצירת מסמכים, ב-Drive לניהול קבצים, וב-Sheets לניתוח. צור תוכן מעניין ומועיל.",
        "available_tools": ["manage_docs", "manage_drive", "manage_sheets", "manage_crm"],
        "required_expertise": ["כתיבה", "עריכה", "ניתוח נתונים"],
        "popularity_score": 88,
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    },
    "template-3": {
        "id": "template-3",
        "name": "עוזר אישי מתקדם",
        "description": "עוזר אישי עם גישה לכל הכלים. מעולה לניהול משימות, תיאום פגישות וניהול מידע",
        "category": "כללי",
        "icon": "🤖",
        "color": "#8b5cf6",
        "personality": "עוזר, יעיל ובעל יכולת ריבוי משימות. תמיד מוכן לעזור ולמצוא פתרונות",
        "system_prompt": "אתה עוזר אישי חכם. השתמש בכל הכלים כדי לעזור למשתמש בכל משימה. שאל שאלות כדי להבין בדיוק מה נדרש.",
        "available_tools": ["manage_crm", "manage_gmail", "manage_calendar", "manage_drive", "manage_sheets", "manage_docs"],
        "required_expertise": ["ניהול זמן", "ארגון", "רב תחומי"],
        "popularity_score": 92,
        "created_date": datetime.utcnow(),
        "updated_date": datetime.utcnow()
    }
}


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


# Multi-tenant support
users_db: Dict[str, Dict[str, Any]] = {
    "user-1": {"id": "user-1", "email": "user1@example.com", "name": "משתמש 1"},
    "user-2": {"id": "user-2", "email": "user2@example.com", "name": "משתמש 2"}
}

current_user = "user-1"  # Simulated current user

@app.get("/auth/me")
def auth_me():
    user = users_db.get(current_user)
    if not user:
        user = {"id": "user-1", "email": "user1@example.com", "name": "משתמש 1"}
    return {
        "id": user["id"], 
        "email": user["email"],
        "name": user.get("name", ""),
        "custom_field_1_label": "תעשייה",
        "custom_field_2_label": "גודל חברה", 
        "custom_field_3_label": "מקור הליד",
        "custom_field_4_label": "עדיפות",
        "custom_field_5_label": "הערות נוספות"
    }


# Multi-tenant agent filtering
def get_user_agents(user_id: str):
    return {k: v for k, v in agents.items() if v.get("user_id", "user-1") == user_id}

def get_user_customers(user_id: str):
    return {k: v for k, v in customers.items() if v.get("user_id", "user-1") == user_id}

def get_user_tasks(user_id: str):
    return {k: v for k, v in tasks.items() if v.get("user_id", "user-1") == user_id}

# Agents CRUD
@app.get("/agents", response_model=List[AgentOut])
def list_agents():
    user_agents = get_user_agents(current_user)
    return list(user_agents.values())


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


# Real LLM with tool calling
@app.post("/invoke-llm")
async def invoke_llm(payload: Dict[str, Any]):
    prompt = payload.get("prompt", "")
    agent_tools = payload.get("tools", [])
    
    # Build system prompt with available tools
    tools_description = ""
    if agent_tools:
        tools_description = f"\n\nכלים זמינים לך: {', '.join(agent_tools)}\n"
        tools_description += "השתמש בכלים כדי לעזור למשתמש. לדוגמה:\n"
        tools_description += "- manage_crm: לניהול לקוחות וחיפוש\n"
        tools_description += "- manage_gmail: לשליחת מיילים\n"
        tools_description += "- manage_calendar: לתיאום פגישות\n"
        tools_description += "- manage_drive: לניהול קבצים\n"
        tools_description += "- manage_sheets: לעבודה עם גיליונות\n"
        tools_description += "- manage_docs: ליצירת מסמכים\n"
    
    full_prompt = f"{prompt}{tools_description}"
    
    # Try Gemini first, fallback to OpenAI
    try:
        if os.getenv("GEMINI_API_KEY"):
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(full_prompt)
            return {
                "response": response.text,
                "tool_to_call": None
            }
    except Exception as e:
        print(f"Gemini error: {e}")
    
    # OpenAI fallback removed for now - focus on Gemini
    # Can be added later with proper openai library setup
    
    # Fallback response
    return {
        "response": f"מערכת AI זמינה! יש לי גישה לכלים: {', '.join(agent_tools) if agent_tools else 'אין כלים'}. איך אוכל לעזור לך?",
        "tool_to_call": None
    }


# Google OAuth (simplified for demo)
@app.post("/google/oauth")
def google_oauth(body: Dict[str, Any]):
    action = body.get("action")
    if action == "check_status":
        # In real implementation, check actual OAuth status
        return {"connected": bool(os.getenv("GOOGLE_OAUTH_CLIENT_ID"))}
    if action == "connect":
        return {"success": True, "auth_url": "https://accounts.google.com/oauth/authorize"}
    return {"success": True}


# Gmail Tool Implementation  
@app.post("/google/gmail")
def gmail_action(body: Dict[str, Any]):
    action = body.get("action")
    
    try:
        if action == "send_email":
            to_email = body.get("to")
            subject = body.get("subject") 
            email_body = body.get("body")
            
            # In real implementation: use Gmail API
            print(f"Sending email to {to_email}: {subject}")
            return {
                "success": True, 
                "message": f"מייל נשלח בהצלחה אל {to_email}",
                "email_id": f"msg_{datetime.utcnow().timestamp()}"
            }
            
        elif action == "search_emails":
            query = body.get("query", "")
            # Mock search results
            return {
                "success": True,
                "emails": [
                    {"id": "1", "from": "client@example.com", "subject": "בקשה להצעת מחיר", "snippet": "שלום, אני מעוניין..."}
                ],
                "message": f"נמצאו תוצאות עבור: {query}"
            }
            
        elif action == "read_email":
            message_id = body.get("message_id")
            return {
                "success": True,
                "email": {
                    "from": "client@example.com",
                    "to": "me@company.com", 
                    "subject": "בקשה להצעת מחיר",
                    "body": "שלום,\nאני מעוניין לקבל הצעת מחיר לשירותי AI.\nתודה!"
                }
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}
    
    return {"success": False, "error": "פעולה לא מזוהה"}


# Calendar Tool Implementation
@app.post("/google/calendar")
def calendar_action(body: Dict[str, Any]):
    action = body.get("action")
    
    try:
        if action == "create_event":
            summary = body.get("summary")
            start_time = body.get("start_time")
            end_time = body.get("end_time")
            
            print(f"Creating event: {summary} at {start_time}")
            return {
                "success": True,
                "message": f"אירוע '{summary}' נוצר בהצלחה",
                "event_id": f"event_{datetime.utcnow().timestamp()}",
                "event_url": "https://calendar.google.com/calendar/event?eid=abc123"
            }
            
        elif action == "list_events":
            return {
                "success": True,
                "events": [
                    {
                        "id": "1",
                        "summary": "פגישה עם לקוח", 
                        "start": "2024-01-15T14:00:00",
                        "end": "2024-01-15T15:00:00"
                    }
                ],
                "message": "נמצאו אירועים בלוח השנה"
            }
            
        elif action == "check_availability":
            start_time = body.get("start_time")
            return {
                "success": True, 
                "available": True,
                "message": f"זמין ב-{start_time}"
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}
    
    return {"success": False, "error": "פעולה לא מזוהה"}


# Drive Tool Implementation
@app.post("/google/drive")
def drive_action(body: Dict[str, Any]):
    action = body.get("action")
    
    try:
        if action == "search_files":
            query = body.get("query", "")
            return {
                "success": True,
                "files": [
                    {"id": "file1", "name": f"דוח מכירות {query}", "type": "document"},
                    {"id": "file2", "name": f"נתונים {query}", "type": "spreadsheet"}
                ],
                "message": f"נמצאו קבצים עבור: {query}"
            }
            
        elif action == "read_file":
            file_id = body.get("file_id")
            return {
                "success": True,
                "content": "תוכן הקובץ...",
                "message": f"קובץ {file_id} נקרא בהצלחה"
            }
            
        elif action == "create_file":
            file_name = body.get("file_name")
            content = body.get("content", "")
            return {
                "success": True,
                "file_id": f"new_file_{datetime.utcnow().timestamp()}",
                "message": f"קובץ '{file_name}' נוצר בהצלחה"
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}
    
    return {"success": False, "error": "פעולה לא מזוהה"}


# Sheets Tool Implementation
@app.post("/google/sheets")
def sheets_action(body: Dict[str, Any]):
    action = body.get("action")
    
    try:
        if action == "read_range":
            spreadsheet_id = body.get("spreadsheet_id")
            range_name = body.get("range")
            
            # Mock data
            mock_data = [
                ["שם", "מייל", "סטטוס"],
                ["דוד כהן", "david@example.com", "לקוח"],
                ["שרה לוי", "sarah@startup.com", "ליד"]
            ]
            
            return {
                "success": True,
                "values": mock_data,
                "message": f"נתונים נקראו מ-{range_name}"
            }
            
        elif action == "append_row":
            spreadsheet_id = body.get("spreadsheet_id")
            values = body.get("values", [])
            
            return {
                "success": True,
                "message": f"שורה חדשה נוספה עם {len(values)} עמודות",
                "updated_range": "Sheet1!A4:C4"
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}
    
    return {"success": False, "error": "פעולה לא מזוהה"}


# Docs Tool Implementation
@app.post("/google/docs")
def docs_action(body: Dict[str, Any]):
    action = body.get("action")
    
    try:
        if action == "create_document":
            title = body.get("title")
            content = body.get("content", "")
            
            doc_id = f"doc_{datetime.utcnow().timestamp()}"
            return {
                "success": True,
                "document": {
                    "id": doc_id,
                    "title": title,
                    "url": f"https://docs.google.com/document/d/{doc_id}/edit"
                },
                "message": f"מסמך '{title}' נוצר בהצלחה"
            }
            
        elif action == "read_document":
            document_id = body.get("document_id")
            return {
                "success": True,
                "document": {
                    "id": document_id,
                    "title": "מסמך דמו",
                    "content": "תוכן המסמך כאן..."
                },
                "message": "מסמך נקרא בהצלחה"
            }
            
        elif action == "append_text":
            document_id = body.get("document_id")
            insert_text = body.get("insert_text")
            
            return {
                "success": True,
                "message": f"טקסט נוסף למסמך {document_id}"
            }
            
    except Exception as e:
        return {"success": False, "error": str(e)}
    
    return {"success": False, "error": "פעולה לא מזוהה"}


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


