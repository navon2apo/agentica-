
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Agent } from '@/api/entities';
import { Customer } from '@/api/entities';
import { User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User as UserIcon, Send, Loader2, ChevronLeft, ChevronRight, Settings, Paperclip, Mic, MicOff } from 'lucide-react';
import IntegrationPanel from '@/components/chat/IntegrationPanel';
import AgentSettingsModal from '@/components/agents/AgentSettingsModal';
import ScheduledTasksPanel from '@/components/chat/ScheduledTasksPanel';
import { googleOAuth } from '@/api/functions';
import { sendGmail } from '@/api/functions';
import { googleCalendar } from '@/api/functions';
import { googleDrive } from '@/api/functions';
import { googleSheets } from '@/api/functions';
import { googleDocs } from '@/api/functions';

function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
            {!isUser &&
      <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-violet-700 text-sm flex h-full w-full items-center justify-center rounded-full"></AvatarFallback>
                </Avatar>
      }
            <div className={`max-w-md p-3 rounded-lg ${
      isUser ?
      'bg-indigo-600 text-white' :
      'glass border border-white/10 text-white'}`
      }>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                {message.timestamp &&
        <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('he-IL')}
                    </p>
        }
            </div>
            {isUser &&
      <Avatar className="w-8 h-8">
                    <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
                </Avatar>
      }
        </div>);

}

export default function AgentChat() {
  const location = useLocation();
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(true);
  const [activeIntegrations, setActiveIntegrations] = useState(['crm']); // Fix: CRM should be active by default
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [showAgentSettings, setShowAgentSettings] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // --- IMPROVED: Better tool definitions with clearer Hebrew instructions ---
  const availableTools = [
{
  name: "manage_crm",
  description: "מערכת ניהול לקוחות מקיפה (CRM) - הכלי היחיד שלך לכל פעולה שקשורה ללקוחות. תומך בחיפוש דינמי, ניהול מלא של נתוני לקוחות, עדכון שדות מותאמים אישית, וכל פעולות CRUD. Advanced Customer Relationship Management system - your single tool for all customer-related operations.",
  integration: "crm",
  arguments: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["search_customers", "get_customer_by_id", "create_customer", "update_customer", "delete_customer", "list_recent_customers"],
        description: "הפעולה לביצוע / Action to perform. כלל קריטי / CRITICAL RULE: search_customers = לחיפוש עם טקסט/שמות / for searching with text/names, get_customer_by_id = רק כשיש לך ID מספרי ברור / ONLY when you have a clear numeric ID."
      },
      customer_id: { 
    type: "string", 
    description: "מזהה ייחודי של לקוח. אופציונלי - אם לא ידוע, השתמש ב-name או email לאיתור הלקוח."
},
      name: { 
        type: "string", 
        description: "שם הלקוח (מלא או חלקי). לחיפוש: כל חלק משם ימצא התאמות. ליצירה: שם מלא נדרש / Customer name (full or partial). For search: any part of name will find matches. For creation: full name required." 
      },
      email: { 
        type: "string", 
        description: "כתובת מייל של הלקוח. תומך בחיפוש מדויק או חלקי / Customer email address. Supports exact or partial search." 
      },
      company: { 
        type: "string", 
        description: "שם החברה. תומך בחיפוש חלקי - 'גוגל' ימצא 'גוגל ישראל בע״מ' / Company name. Supports partial search - 'Google' will find 'Google Israel Ltd'." 
      },
      phone: { 
        type: "string", 
        description: "מספר טלפון של הלקוח. כל פורמט מקובל (050-1234567, +972-50-1234567) / Customer phone number. Any format accepted (050-1234567, +972-50-1234567, etc.)." 
      },
      status: { 
        type: "string", 
        enum: ["lead", "prospect", "customer", "churned"], 
        description: "סטטוס הלקוח: lead=לקוח פוטנציאלי, prospect=בתהליך מכירה, customer=לקוח קיים, churned=נטש / Customer status: lead=potential customer, prospect=in sales process, customer=existing client, churned=left." 
      },
      data_to_update: { 
        type: "object", 
        description: "אובייקט עם כל השדות לעדכון. יכול לכלול: name, email, company, phone, status, notes, custom_field_1-5, או כל שדה קיים. דוגמה: {'phone': '050-9999999', 'status': 'customer', 'custom_field_1': 'VIP'} / Object with all fields to update. Can include: name, email, company, phone, status, notes, custom_field_1-5, or any existing field. Example: {'phone': '050-9999999', 'status': 'customer', 'custom_field_1': 'VIP'}." 
      },
      notes: { 
        type: "string", 
        description: "הערות על הלקוח. יכול להוסיף מידע או להחליף קיים / Notes about the customer. Can add information or replace existing." 
      },
      custom_field_1: { type: "string", description: "שדה מותאם אישית 1 / Custom field 1" },
      custom_field_2: { type: "string", description: "שדה מותאם אישית 2 / Custom field 2" },
      custom_field_3: { type: "string", description: "שדה מותאם אישית 3 / Custom field 3" },
      custom_field_4: { type: "string", description: "שדה מותאם אישית 4 / Custom field 4" },
      custom_field_5: { type: "string", description: "שדה מותאם אישית 5 / Custom field 5" },
      limit: { 
        type: "integer", 
        default: 5, 
   description: "מספר תוצאות מקסימלי בחיפוש (1-20). ברירת מחדל: 5 / Maximum number of search results (1-20). Default: 5." 
      }
    },
    required: ["action"]
  }
},
{
  name: "manage_gmail",
    description: "ניהול חשבון Gmail. מאפשר שליחת מייל, חיפוש מיילים, וקריאת תוכן של מייל ספציפי. תומך בעברית מלאה.",
    integration: "gmail",
    arguments: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["send_email", "search_emails", "read_email"],
          description: "הפעולה לביצוע: 'send_email', 'search_emails', 'read_email'."
        },
        to: { type: "string", description: "כתובת הנמען (עבור שליחה)." },
        subject: { type: "string", description: "נושא המייל (עבור שליחה)." },
        body: { type: "string", description: "גוף המייל (עבור שליחה)." },
        query: { type: "string", description: "שאילתת חיפוש, למשל: 'from:example@email.com subject:חשבונית' (עבור חיפוש)." },
        message_id: { type: "string", description: "מזהה ייחודי של המייל לקריאה (עבור קריאה)." }
      },
      "required": ["action"]
    }
  },
  {
    name: "manage_calendar",
    description: "ניהול יומן גוגל - יצירת פגישות, בדיקת זמינות, וצפייה באירועים. תומך בעברית ואנגלית לכל הפעולות.",
    integration: "calendar",
    arguments: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create_event", "list_events", "check_availability"],
          description: "סוג הפעולה: create_event (יצירת אירוע), list_events (רשימת אירועים), check_availability (בדיקת זמינות)"
        },
        summary: {
          type: "string",
          description: "כותרת האירוע (נדרש ליצירת אירוע)"
        },
        description: {
          type: "string",
          description: "תיאור האירוע (אופציונלי)"
        },
        start_time: {
          type: "string",
          description: "זמן התחלה בפורמט ISO 8601 (למשל: 2024-01-15T14:00:00)"
        },
        end_time: {
          type: "string",
          description: "זמן סיום בפורמט ISO 8601 (למשל: 2024-01-15T15:00:00)"
        },
        attendee_emails: {
          type: "array",
          items: { type: "string" },
          description: "רשימת כתובות מייל של המשתתפים (אופציונלי)"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "manage_drive",
    description: "ניהול קבצים ב-Google Drive. מאפשר חיפוש, קריאה ויצירה של קבצים.",
    integration: "drive",
    arguments: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["search_files", "read_file", "create_file"],
          description: "הפעולה לביצוע: 'search_files' (חיפוש קבצים), 'read_file' (קריאת תוכן מקובץ), 'create_file' (יצירת קובץ חדש)."
        },
        query: { type: "string", description: "טקסט לחיפוש בשמות הקבצים (עבור search_files)." },
        file_id: { type: "string", description: "מזהה הקובץ לקריאה (עבור read_file)." },
        file_name: { type: "string", description: "שם הקובץ ליצירה (עבור create_file)." },
        content: { type: "string", description: "התוכן שייכתב לקובץ החדש (עבור create_file)." }
      },
      required: ["action"]
    }
  },
  {
    name: "manage_sheets",
    description: "עבודה עם Google Sheets. מאפשר קריאת נתונים והוספת שורות חדשות.",
    integration: "sheets",
    arguments: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["read_range", "append_row"],
          description: "הפעולה לביצוע: 'read_range' (קריאת טווח תאים), 'append_row' (הוספת שורה)."
        },
        spreadsheet_id: { type: "string", description: "מזהה הגיליון האלקטרוני (חובה)." },
        range: { type: "string", description: "הטווח לקריאה או שם הגיליון להוספה (למשל 'Sheet1!A1:B5' או 'Sheet1')." },
        values: { type: "array", items: { type: "string" }, description: "מערך של ערכים להוספה כשורה חדשה (עבור append_row)." }
      },
      required: ["action", "spreadsheet_id", "range"]
    }
  },
  {
    name: "manage_docs",
    description: "עבודה עם Google Docs. מאפשר יצירת מסמכים חדשים, קריאת תוכן מסמכים קיימים והוספת טקסט למסמכים.",
    integration: "docs",
    arguments: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create_document", "read_document", "append_text"],
          description: "הפעולה לביצוע: 'create_document' (יצירת מסמך חדש), 'read_document' (קריאת תוכן מסמך), 'append_text' (הוספת טקסט למסמך קיים)."
        },
        document_id: { type: "string", description: "מזהה המסמך (נדרש עבור read_document ו-append_text)." },
        title: { type: "string", description: "כותרת המסמך החדש (נדרש עבור create_document)." },
        content: { type: "string", description: "תוכן ראשוני למסמך החדש (אופציונלי עבור create_document)." },
        insert_text: { type: "string", description: "הטקסט להוספה למסמך (נדרש עבור append_text)." }
      },
      required: ["action"]
    }
  }];


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const agentId = params.get('id');
    if (agentId) {
      loadAgent(agentId);
    }

    // Check Google connection status on load
    const checkConnection = async () => {
      try {
        const response = await googleOAuth({ action: 'check_status' });
        // Handle both direct response and nested data response
        const responseData = response.data || response;
        if (responseData && responseData.connected) {
          setGoogleConnected(true);
        } else {
          setGoogleConnected(false);
        }
      } catch (error) {
        console.error("Failed to check Google connection status:", error);
        setGoogleConnected(false);
      }
    };
    checkConnection();

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'he-IL';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [location]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const loadAgent = async (id) => {
    try {
      const agentData = await Agent.get(id);
      setAgent(agentData);

      // This is a placeholder. In a real app, you'd select a customer to chat about.
      // For now, let's see if there are any customers. If so, use the first one.
      const customers = await Customer.list(); // Fetch all customers
      if (customers.length > 0) {
        // Sort by created_date desc to get the most recent one if no specific criteria
        const mostRecentCustomer = customers.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        setCurrentCustomerId(mostRecentCustomer.id);
         setMessages([{
            sender: 'agent',
            text: `שלום! אני ${agentData.name}. אני רואה שהשיחה שלנו היא בהקשר של הלקוח: ${mostRecentCustomer.name}.\n\nאיך אוכל לעזור היום?`,
            timestamp: new Date()
        }]);
      } else {
        setMessages([{
            sender: 'agent',
            text: `שלום! אני ${agentData.name}. כדי שאוכל לעזור, אנא צור לקוח ראשון במערכת.\n\nאיך אוכל לעזור היום?`,
            timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error("Failed to load agent", error);
      setMessages([{
        sender: 'agent',
        text: "שגיאה בטעינת הסוכן. אנא נסה שוב.",
        timestamp: new Date()
      }]);
    }
  };

  const handleSaveAgentSettings = async (settingsData) => {
    try {
      await Agent.update(agent.id, settingsData);
      setAgent((prev) => ({ ...prev, ...settingsData }));
      alert('הגדרות הסוכן נשמרו בהצלחה!');
      setShowAgentSettings(false); // Close modal on success
    } catch (error) {
      console.error('Failed to save agent settings:', error);
      alert('שגיאה בשמירת ההגדרות');
    }
  };

  const handleVoiceRecording = () => {
    if (!recognition) {
      alert('הקלטה קולית אינה נתמכת בדפדפן זה');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !agent) return;

    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Filter the available tools based on the active integrations in the UI
      const activeTools = availableTools.filter((tool) => {
        const googleServices = ['gmail', 'calendar', 'drive', 'sheets', 'docs'];
        if (googleServices.includes(tool.integration)) {
          // The 'gmail' integration checkbox likely controls all Google services
          // This assumes `activeIntegrations` will contain 'gmail' if any google tool is active
          return activeIntegrations.includes('gmail'); 
        }
        return activeIntegrations.includes(tool.integration);
      });

      console.log('=== DEBUG: Active Tools for Agent ===');
      console.log('Active integrations:', activeIntegrations);
      console.log('Tools available to agent:', activeTools.map((t) => ({
        name: t.name,
        description: t.description,
        required_params: t.arguments.required
      })));

      const conversationHistory = newMessages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n');
      const knowledgeBaseContent = agent.knowledge_base?.map((kb) => `File: ${kb.file_name}\nContent: ${kb.content}`).join('\n---\n') || 'No knowledge base provided.';

const prompt = `אתה ${agent.name}, עוזר AI עם האישיות של: ${agent.personality}.
הוראות הבסיס שלך: ${agent.system_prompt || 'אתה עוזר מועיל.'}

יש לך גישה לכלים. כשאתה צריך להשתמש בכלי, אתה חייב לפרמט את התגובה שלך כאובייקט JSON.

הכלים הזמינים לך למשימה זו:
---
${JSON.stringify(activeTools, null, 2)}
---
**כללים קריטיים לעבודה עם CRM - חובה לקרוא:**
1. כשמשתמש נותן שם לקוח (כמו "יוסי כהן", "דנה לוי") - תמיד השתמש ב-search_customers עם name
2. כשמשתמש נותן מספר ID (כמו "12345") - השתמש ב-get_customer_by_id עם customer_id
3. למחיקת לקוח - תמיד חפש אותו קודם עם search_customers כדי לקבל ID
4. אל תעביר שמות לפרמטר customer_id - זה תמיד מספר בלבד
5. **לעדכון לקוח: השתמש ב-update_customer ישירות עם name במקום customer_id! אין צורך לחפש קודם.**

בהתבסס על בקשת המשתמש, החלט על הצעד הבא. התגובה שלך חייבת להיות אובייקט JSON שמתאים לסכמה הבאה:
{
  "response": "הודעה להציג למשתמש. זה יכול להיות אישור, שאלה, או תשובה סופית.",
  "tool_to_call": { "name": "שם_הכלי", "arguments": { "פרמטר": "ערך" } } או null
}

דוגמאות נכונות לשימוש בכלי CRM:
- "מי זה יוסי כהן?" -> search_customers עם {"action": "search_customers", "name": "יוסי כהן"}
- "חפש לקוחות מחברת ישראטק" -> search_customers עם {"action": "search_customers", "company": "ישראטק"}
- "מצא לקוח עם מייל dani@levi.com" -> search_customers עם {"action": "search_customers", "email": "dani@levi.com"}
- "קבל פרטי לקוח 12345" -> get_customer_by_id עם {"action": "get_customer_by_id", "customer_id": "12345"}
- "צור לקוח חדש: דנה לוי" -> create_customer עם {"action": "create_customer", "name": "דנה לוי", "email": "dana@h.com"}
- "הצג לקוחות אחרונים" -> list_recent_customers עם {"action": "list_recent_customers"}
- "הוסף טלפון ליוסי כהן" -> update_customer עם {"action": "update_customer", "name": "יוסי כהן", "data_to_update": {"phone": "050-1234567"}}
- "עדכן מייל של דנה לוי" -> update_customer עם {"action": "update_customer", "name": "דנה לוי", "data_to_update": {"email": "dana@newmail.com"}}

דוגמאות לשימוש בכלי Gmail:
- "שלח מייל ל-john@example.com עם נושא 'שלום' וכתוב לו תודה על הרכישה" -> manage_gmail עם {"action": "send_email", "to": "john@example.com", "subject": "שלום", "body": "תודה על הרכישה!"}
- "חפש לי מיילים שקיבלתי מ'invoices@company.com'" -> manage_gmail עם {"action": "search_emails", "query": "from:invoices@company.com"}
- "קרא לי את המייל עם ID 'msg12345'" -> manage_gmail עם {"action": "read_email", "message_id": "msg12345"}

דוגמאות לשימוש בכלי יומן:
- אם המשתמש אומר "תקבע לי פגישה עם יואב מחר ב-10 בבוקר, שתמשך שעה, נושא הפגישה הוא פרויקט X", ויואב ב-yoav@example.com
- אתה צריך לקרוא לכלי manage_calendar עם: {"action": "create_event", "summary": "פרויקט X", "start_time": "2024-XX-XXT10:00:00", "end_time": "2024-XX-XXT11:00:00", "attendee_emails": ["yoav@example.com"]}
- אם המשתמש אומר "האם אני פנוי מ tomorrow בין 14:00 ל-15:00?"
- אתה צריך לקרוא לכלי manage_calendar עם: {"action": "check_availability", "start_time": "2024-XX-XXT14:00:00", "end_time": "2024-XX-XXT15:00:00"}
- אם המשתמש אומר "תציג לי את האירועים הקרובים שלי ביומן"
- אתה צריך לקרוא לכלי manage_calendar עם: {"action": "list_events"}

דוגמאות לשימוש בכלי Google Drive:
- "חפש לי בדרייב קבצים עם המילה 'חשבונית'" -> manage_drive עם {"action": "search_files", "query": "חשבונית"}
- "מה התוכן של קובץ עם ID '123xyz'?" -> manage_drive עם {"action": "read_file", "file_id": "123xyz"}
- "צור קובץ חדש בשם 'סיכום.txt' עם התוכן 'זהו סיכום הפגישה'" -> manage_drive עם {"action": "create_file", "file_name": "סיכום.txt", "content": "זהו סיכום הפגישה"}

דוגמאות לשימוש בכלי Google Sheets:
- "קרא את 5 השורות הראשונות בגיליון בשם 'לקוחות' בקובץ עם ID 'abc123'" -> manage_sheets עם {"action": "read_range", "spreadsheet_id": "abc123", "range": "לקוחות!A1:E5"}
- "הוסף שורה עם הפרטים 'אבי כהן', 'avi@email.com' לגיליון 'לידים' בקובץ 'abc123'" -> manage_sheets עם {"action": "append_row", "spreadsheet_id": "abc123", "range": "לידים", "values": ["אבי כהן", "avi@email.com"]}

דוגמאות לשימוש בכלי Google Docs:
- "צור מסמך חדש בשם 'דוח פרויקט' עם התוכן 'זהו דוח הפרויקט הראשוני'" -> manage_docs עם {"action": "create_document", "title": "דוח פרויקט", "content": "זהו דוח הפרויקט הראשוני"}
- "מה הכתוב במסמך עם ID 'doc123'?" -> manage_docs עם {"action": "read_document", "document_id": "doc123"}
- "הוסף למסמך 'doc123' את הטקסט 'זוהי תוספת חדשה'" -> manage_docs עם {"action": "append_text", "document_id": "doc123", "insert_text": "זוהי תוספת חדשה"}
---
היסטוריית השיחה:
${conversationHistory}

---
בסיס ידע:
${knowledgeBaseContent}
---

עכשיו, עבד על הבקשה האחרונה של המשתמש: "${userMessage.text}"
התגובה JSON שלך:`;

      const responseSchema = {
        type: "object",
        properties: {
          response: {
            type: "string",
            description: "A message to show to the user."
          },
          tool_to_call: {
            type: ["object", "null"],
            properties: {
              name: { type: "string" },
              arguments: { type: "object" }
            }
          }
        },
        required: ["response"]
      };

      const llmResponse = await InvokeLLM({
        prompt: prompt,
        response_json_schema: responseSchema,
        temperature: agent.temperature || 0.7
      });

      console.log('=== DEBUG: LLM Response ===');
      console.log('LLM decided to call tool:', llmResponse.tool_to_call?.name || 'No tool');
      console.log('Tool arguments:', llmResponse.tool_to_call?.arguments || 'N/A');

      // Show the agent's initial response
      const agentResponseMessage = {
        sender: 'agent',
        text: llmResponse.response || "אני עובד על זה...",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, agentResponseMessage]);

      // Execute tool if decided by the agent
      if (llmResponse.tool_to_call) {
        const { name: toolName, arguments: toolArgs } = llmResponse.tool_to_call;

        console.log('=== DEBUG: Tool Execution ===');
        console.log('Tool name:', toolName);
        console.log('Tool args:', toolArgs);

        // Show thinking message
        const thinkingMessage = {
          sender: 'agent',
          text: `מבצע פעולה: ${toolName}...`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, thinkingMessage]);

        // Execute the tool
        let toolResult = null;
        let toolError = null;

        try {
          if (toolName === 'manage_crm') {
            const { action, name, email, company, phone, status, limit, customer_id, data_to_update } = toolArgs;
            
            console.log('=== DEBUG: CRM Tool Execution ===');
            console.log('Action:', action);
            console.log('Parameters:', { name, email, company, phone, status, limit, customer_id });
            
            if (action === 'search_customers') {
                const filter = {};
                // Fix: Use correct Base44 filter syntax (assuming exact match for these fields unless explicitly doing partial via list)
                if (name) filter.name = name;
                if (email) filter.email = email;
                if (company) filter.company = company;
                if (phone) filter.phone = phone;
                if (status) filter.status = status;

                if (Object.keys(filter).length === 0) {
                    toolError = "לחיפוש לקוחות, אנא ספק לפחות קריטריון אחד (כמו שם, אימייל או חברה).";
                } else {
                    console.log('Filter object:', filter);
                    // Fix: Use correct Base44 filter syntax (assuming filter doesn't take order/limit directly)
                    let customers = await Customer.filter(filter);
                    console.log('Found customers (exact match attempt):', customers.length);

                    // Try partial search if exact search fails AND only a name was provided
                    if (customers.length === 0) {
                        if (name && !email && !company && !phone && !status) { // Only name was the primary filter criterion
                            // For name search, try to find customers that contain the search term
                            const allCustomers = await Customer.list(); // Fetch all customers for client-side partial match
                            customers = allCustomers.filter(c => 
                                c.name && c.name.toLowerCase().includes(name.toLowerCase())
                            );
                            console.log('Found customers (partial name match attempt):', customers.length);
                        }
                    }
                    
                    if (customers.length === 0) {
                        toolResult = `לא נמצאו לקוחות התואמים לחיפוש.`;
                    } else if (customers.length === 1) {
                        const c = customers[0];
                        toolResult = `נמצא לקוח אחד:\n\nשם: ${c.name}\nאימייל: ${c.email}\nטלפון: ${c.phone || 'לא הוזן'}\nחברה: ${c.company || 'לא הוזנה'}\nסטטוס: ${c.status || 'לא הוגדר'}\nמזהה (ID): ${c.id}`;
                    } else {
                        const displayLimit = Math.min(limit || 5, 20); // Enforce max limit of 20
                        // Sort by name for consistent display order
                        customers.sort((a,b) => (a.name || '').localeCompare(b.name || ''));
                        
                        toolResult = `נמצאו ${customers.length} לקוחות:\n\n` + 
                            customers.slice(0, displayLimit).map(c => 
                                `• שם: ${c.name}, חברה: ${c.company || 'N/A'}, טלפון: ${c.phone || 'לא הוזן'}, מזהה (ID): ${c.id}`
                            ).join('\n');
                    }
                }

            } else if (action === 'get_customer_by_id') {
                if (!customer_id) { 
                    toolError = "שגיאה: חובה לספק customer_id."; 
                } else {
                    const customer = await Customer.get(customer_id);
                    if (!customer) { 
                        toolResult = `לא נמצא לקוח עם מזהה ${customer_id}.`; 
                    } else {
                        toolResult = `פרטי הלקוח:\n\nשם: ${customer.name}\nאימייל: ${customer.email}\nטלפון: ${customer.phone || 'לא הוזן'}\nחברה: ${customer.company || 'לא הוזנה'}\nסטטוס: ${customer.status || 'לא הוגדר'}\nמזהה (ID): ${customer.id}`;
                    }
                }
                
            } else if (action === 'list_recent_customers') {
                // Fix: Use correct Base44 list syntax and client-side sorting/slicing
                const customers = await Customer.list(); // Fetch all customers
                if (customers.length === 0) {
                    toolResult = `לא נמצאו לקוחות במערכת.`;
                } else {
                    // Sort by updated_date (or created_date if updated_date is missing) in descending order
                    const sortedCustomers = customers
                        .sort((a, b) => {
                            const dateA = new Date(b.updated_date || b.created_date);
                            const dateB = new Date(a.updated_date || a.created_date);
                            return dateA - dateB;
                        })
                        .slice(0, 10); // Take the top 10

                    toolResult = `10 הלקוחות האחרונים שעודכנו:\n\n` + 
                        sortedCustomers.map(c => 
                            `• שם: ${c.name}, חברה: ${c.company || 'N/A'}, טלפון: ${c.phone || 'לא הוזן'}, מזהה (ID): ${c.id}`
                        ).join('\n');
                }
                
            } else if (action === 'create_customer') {
                if (!name || !email || !company) {
                    toolError = "שגיאה: ליצירת לקוח חדש, אני צריך שם מלא, כתובת אימייל ושם חברה. תוכל לספק לי אותם?";
                } else {
                    const newCustomer = await Customer.create({ 
                        name, 
                        email, 
                        company, 
                        phone: phone || '', // Ensure phone is an empty string if not provided
                        status: status || 'lead' // Set default status if not provided
                    });
                    toolResult = `✅ לקוח חדש נוצר בהצלחה:\nשם: ${newCustomer.name}\nמזהה: ${newCustomer.id}`;
                }
                
} else if (action === 'update_customer') {
    if ((!customer_id && !name && !email) || !data_to_update) {
        toolError = "שגיאה: לעדכון לקוח, ספק customer_id או name או email + נתונים לעדכון.";
    } else {
        let targetCustomer = null;
        
        // אם יש ID - השתמש בו ישירות
        if (customer_id) {
            targetCustomer = await Customer.get(customer_id);
        } 
        // אם אין ID - חפש לפי שם או אימייל
        else {
            const filter = {};
            if (name) filter.name = name;
            if (email) filter.email = email;
            
            let customers = await Customer.filter(filter);
            
            // אם לא נמצא חיפוש מדויק ויש שם - נסה חיפוש חלקי
            if (customers.length === 0 && name && !email) {
                const allCustomers = await Customer.list();
                customers = allCustomers.filter(c => 
                    c.name && c.name.toLowerCase().includes(name.toLowerCase())
                );
            }
            
            if (customers.length === 0) {
                toolError = `לא נמצא לקוח עם הפרטים שסופקו.`;
            } else if (customers.length > 1) {
                toolError = `נמצאו ${customers.length} לקוחות. אנא ספק פרטים יותר ספציפיים:\n${customers.slice(0,3).map(c => `• ${c.name} (ID: ${c.id})`).join('\n')}`;
            } else {
                targetCustomer = customers[0];
            }
        }
        
        if (!targetCustomer && !toolError) {
            toolError = `לא נמצא לקוח לעדכון.`;
        } else if (targetCustomer) {
            const updated = await Customer.update(targetCustomer.id, data_to_update);
            toolResult = `✅ לקוח ${updated.name} עודכן בהצלחה.`;
        }
    }
                
            } else if (action === 'delete_customer') {
                if (!customer_id) {
                    toolError = "שגיאה: מזהה לקוח נדרש למחיקה.";
                } else {
                    await Customer.delete(customer_id);
                    toolResult = `✅ לקוח עם מזהה ${customer_id} נמחק בהצלחה.`;
                }
            } else {
                toolError = `פעולת CRM לא ידועה: ${action}`;
            }
          } else if (toolName === 'manage_gmail') {
            const { action, to, subject, body, query, message_id } = toolArgs;

            console.log('=== DEBUG: Gmail Parameters ===');
            console.log('Action:', action);
            console.log('Args:', toolArgs);

            const emailResponse = await sendGmail({ action, to, subject, body, query, message_id });

            console.log('=== DEBUG: sendGmail Response ===');
            console.log('Status:', emailResponse.status);
            console.log('Success:', emailResponse.data?.success);

            if (emailResponse.data && emailResponse.data.success) {
              if (action === 'send_email') {
                toolResult = `✅ המייל נשלח בהצלחה לנמען: ${to}`;
              } else if (action === 'search_emails') {
                const emails = emailResponse.data.emails || [];
                if (emails.length === 0) {
                  toolResult = `לא נמצאו מיילים התואמים לחיפוש שלך: "${query}"`;
                } else {
                  toolResult = `מצאתי ${emails.length} מיילים רלוונטיים:\n\n${emails.map((e) => `• נושא: ${e.subject}\n  מאת: ${e.from}\n  ID: ${e.id}`).join('\n\n')}`;
                }
              } else if (action === 'read_email') {
                const email = emailResponse.data.email;
                if (!email) {
                  toolResult = `לא נמצא מייל עם מזהה ${message_id}.`;
                } else {
                  toolResult = `תוכן המייל (ID: ${message_id}):\n\nמאת: ${email.from}\nלכבוד: ${email.to}\nנושא: ${email.subject}\n\nתוכן: ${email.body}`;
                }
              }
            } else {
              throw new Error(emailResponse.data?.error || `Failed to perform Gmail action: ${action}.`);
            }
          } else if (toolName === 'manage_calendar') {
            const { action, summary, description, start_time, end_time, attendee_emails } = toolArgs;

            console.log('=== DEBUG: Calendar Parameters ===');
            console.log('Action:', action);
            console.log('Summary:', summary);
            console.log('Description:', description);
            console.log('Start time:', start_time);
            console.log('End time:', end_time);
            console.log('Attendee emails:', attendee_emails);

            if (!action) {
              toolError = "שגיאה: חסר סוג פעולה ליומן (create_event, list_events, או check_availability).";
            } else {
              console.log('=== DEBUG: Calling googleCalendar function ===');

              const calendarResponse = await googleCalendar({
                action,
                summary,
                description,
                start_time,
                end_time,
                attendee_emails,
              });

              console.log('=== DEBUG: googleCalendar Response ===');
              console.log('Status:', calendarResponse.status);
              console.log('Success:', calendarResponse.data?.success);

              if (calendarResponse.data && calendarResponse.data.success) {
                if (action === 'create_event') {
                  toolResult = `✅ האירוע נוצר בהצלחה ביומן!
                                    
📅 פרטי האירוע:
• כותרת: ${summary}
• זמן התחלה: ${new Date(start_time).toLocaleString('he-IL')}
• זמן סיום: ${new Date(end_time).toLocaleString('he-IL')}
${attendee_emails && attendee_emails.length > 0 ? `• משתתפים: ${attendee_emails.join(', ')}` : ''}`;
                } else if (action === 'list_events') {
                  const events = calendarResponse.data.events || [];
                  if (events.length === 0) {
                    toolResult = "📅 אין אירועים מתוכננים לשבוע הקרוב.";
                  } else {
                    toolResult = `📅 אירועים לשבוע הקרוב:\n\n${events.map((event) =>
                    `• ${event.summary} - ${new Date(event.start).toLocaleDateString('he-IL')} ${new Date(event.start).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
                    ).join('\n')}`;
                  }
                } else if (action === 'check_availability') {
                  toolResult = `🔍 בדיקת זמינות:
${calendarResponse.data.available ? '✅ הזמן פנוי לקביעת פגישה' : '❌ הזמן תפוס'}

זמן נבדק: ${new Date(start_time).toLocaleString('he-IL')} - ${new Date(end_time).toLocaleString('he-IL')}`;
                }
              } else {
                throw new Error(calendarResponse.data?.error || "Failed to perform calendar operation.");
              }
            }
          } else if (toolName === 'manage_drive') {
            const driveResponse = await googleDrive({ ...toolArgs });
            if (driveResponse.data?.success) {
              if (toolArgs.action === 'search_files') {
                const files = driveResponse.data.files || [];
                if (files.length === 0) {
                  toolResult = "לא נמצאו קבצים שתואמים לחיפוש.";
                } else {
                  toolResult = `מצאתי ${files.length} קבצים:\n${files.map((f) => `• ${f.name} (ID: ${f.id})`).join('\n')}`;
                }
              } else if (toolArgs.action === 'read_file') {
                toolResult = `תוכן הקובץ:\n\n${driveResponse.data.content}`; // Assuming content is in data.content
              } else if (toolArgs.action === 'create_file') {
                toolResult = `הקובץ "${driveResponse.data.file.name}" נוצר בהצלחה.\nקישור: ${driveResponse.data.file.webViewLink}`;
              }
            } else {
              throw new Error(driveResponse.data?.error || "Failed to perform Drive operation.");
            }
          } else if (toolName === 'manage_sheets') {
            const sheetsResponse = await googleSheets({ ...toolArgs });
            if (sheetsResponse.data?.success) {
              if (toolArgs.action === 'read_range') {
                const values = sheetsResponse.data.values || [];
                if (values.length === 0) {
                  toolResult = "לא נמצאו נתונים בטווח המבוקש.";
                } else {
                  toolResult = `הנתונים מהגיליון:\n${values.map((row) => row.join(', ')).join('\n')}`;
                }
              } else if (toolArgs.action === 'append_row') {
                toolResult = `השורה נוספה בהצלחה לגיליון.`;
              }
            } else {
              throw new Error(sheetsResponse.data?.error || "Failed to perform Sheets operation.");
            }
          } else if (toolName === 'manage_docs') {
            const docsResponse = await googleDocs({ ...toolArgs });
            if (docsResponse.data?.success) {
              if (toolArgs.action === 'create_document') {
                toolResult = `המסמך "${docsResponse.data.document.title}" נוצר בהצלחה!\nמזהה המסמך: ${docsResponse.data.document.id}\nקישור: ${docsResponse.data.document.url}`;
              } else if (toolArgs.action === 'read_document') {
                toolResult = `תוכן המסמך "${docsResponse.data.document.title}":\n\n${docsResponse.data.document.content}`;
              } else if (toolArgs.action === 'append_text') {
                toolResult = `הטקסט נוסף בהצלחה למסמך.`;
              }
            } else {
              throw new Error(docsResponse.data?.error || "Failed to perform Docs operation.");
            }
          } else {
            toolError = `כלי לא מוכר: ${toolName}`;
          }
        } catch (error) {
          console.error(`=== DEBUG: Tool execution error for ${toolName} ===`);
          console.error('Error object:', error);
          console.error('Error response:', error.response);
          console.error('Error response data:', error.response?.data);

          if (error.response && error.response.data && error.response.data.code === 'RATE_LIMIT_EXCEEDED') {
            toolError = error.response.data.error;
          } else if (error.response && error.response.data && error.response.data.error) {
            toolError = error.response.data.error;
          } else {
            toolError = `שגיאה בביצוע הכלי ${toolName}: ${error.message}`;
          }
        }

        // Generate final response based on tool result
        if (toolError) {
          const errorMessage = {
            sender: 'agent',
            text: toolError,
            timestamp: new Date()
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else {
          // Send tool result back to LLM for a nice formatted response
          const finalPrompt = `אתה ${agent.name}. המשתמש ביקש: "${userMessage.text}"

ביצעתי את הכלי '${toolName}' וקיבלתי את התוצאות האלה:
---
${toolResult}
---

אנא ספק תגובה מועילת וידידותית למשתמש בעברית בהתבסס על התוצאות האלה. היה שיחתי וטבעי.`;

          const finalResponse = await InvokeLLM({
            prompt: finalPrompt
          });

          const finalMessage = {
            sender: 'agent',
            text: finalResponse.response || finalResponse || "תגובה מהסוכן",
            timestamp: new Date()
          };
          setMessages((prev) => [...prev, finalMessage]);
        }
      }

    } catch (error) {
      console.error('=== DEBUG: General error in handleSendMessage ===');
      console.error('Error:', error);
      const errorResponse = {
        sender: 'agent',
        text: "מצטער, אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>);

  }

  return (
    <div className="h-full flex flex-col lg:flex-row" dir="rtl">
            {/* Integration Panel */}
            {showIntegrations &&
      <div className={`${
      showIntegrations ? 'block' : 'hidden'} lg:block flex-shrink-0 p-2 lg:p-4 space-y-4 w-full lg:w-auto max-h-48 lg:max-h-none overflow-y-auto lg:overflow-visible`
      }>
                    <IntegrationPanel
          onIntegrationChange={setActiveIntegrations}
          googleConnected={googleConnected} />

                    <div className="hidden lg:block">
                        <ScheduledTasksPanel />
                    </div>
                </div>
      }

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-h-0">
                <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                            <Bot className="w-6 h-6 lg:w-7 lg:h-7 text-indigo-400" />
                            {agent.name}
                        </h1>
                        <p className="text-white/60 text-sm">{agent.personality || "מוכן לפעולה"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAgentSettings(true)}
              className="glass-hover border border-white/20 text-white text-xs lg:text-sm">

                            <Settings className="w-4 h-4 mr-1 lg:mr-2" />
                            הגדרות
                        </Button>
                        <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowIntegrations(!showIntegrations)}
              className="glass-hover border border-white/20 text-white text-xs lg:text-sm">

                            {showIntegrations ?
              <>
                                    <ChevronRight className="w-4 h-4 mr-1 lg:mr-2" />
                                    הסתר כלים
                                </> :

              <>
                                    <ChevronLeft className="w-4 h-4 mr-1 lg:mr-2" />
                                    הצג כלים
                                </>
              }
                        </Button>
                    </div>
                </header>
                
                <div className="flex-1 flex flex-col bg-black/20 rounded-xl glass overflow-hidden min-h-0">
                    <div className="flex-1 p-3 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto">
                        {messages.map((msg, index) =>
            <ChatMessage key={index} message={msg} />
            )}
                        {isLoading &&
            <div className="flex items-start gap-4">
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
                                </Avatar>
                                <div className="glass border border-white/10 p-3 rounded-lg">
                                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                                </div>
                            </div>
            }
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 lg:p-4 border-t border-white/10">
                        <div className="relative">
                            <Textarea
                ref={textareaRef}
                placeholder={isRecording ? "מקליט..." : "כתוב הודעה לסוכן... (Shift+Enter לשורה חדשה)"}
                className="glass border-white/20 text-white pl-28 lg:pl-32 pr-4 py-3 min-h-[48px] max-h-40 w-full resize-none overflow-y-auto text-sm lg:text-base"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading) handleSendMessage();
                  }
                }}
                disabled={isLoading || isRecording}
                rows={1} />

                            <div className="absolute left-2 lg:left-3 bottom-2.5 flex items-center gap-1 lg:gap-2">
                                <button className="p-1 lg:p-2 rounded-full text-white/70 hover:text-white transition-colors">
                                    <Paperclip className="w-4 h-4 lg:w-5 h-5" />
                                </button>
                                <button
                  onClick={handleVoiceRecording}
                  className={`p-1 lg:p-2 rounded-full transition-colors ${
                  isRecording ?
                  'bg-red-600 text-white animate-pulse' :
                  'text-white/70 hover:text-white hover:bg-white/10'}`
                  }>

                                    {isRecording ? <MicOff className="w-4 h-4 lg:w-5 h-5" /> : <Mic className="w-4 h-4 lg:w-5 h-5" />}
                                </button>
                                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || isRecording}
                  className="p-1 lg:p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-500">

                                    <Send className="w-4 h-4 lg:w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Settings Modal */}
            <AgentSettingsModal
        isOpen={showAgentSettings}
        onClose={() => setShowAgentSettings(false)}
        agent={agent}
        onSave={handleSaveAgentSettings} />

        </div>);

}
