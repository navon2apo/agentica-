
import React, { useState, useEffect } from 'react';
import { ScheduledTask } from '@/api/entities';
import { Agent } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
    Clock, 
    Plus, 
    Play, 
    Pause, 
    Trash2, 
    Settings,
    CheckCircle,
    XCircle,
    Loader2,
    Calendar,
    Zap,
    Globe
} from 'lucide-react';
import { runScheduledTask } from '@/api/functions';

export default function ScheduledTasksPanel({ currentAgentId }) {
    const [tasks, setTasks] = useState([]);
    const [agents, setAgents] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState({
        agent_id: '',
        task_name: '',
        description: '',
        schedule_type: 'daily',
        schedule_time: '09:00',
        schedule_day: 1,
        workflow_definition: '',
        workflow_type: 'prompt',
        tools_to_use: [],
        webhook_trigger: false
    });

    useEffect(() => {
        loadData();
        if (currentAgentId) {
            setNewTask(prev => ({ ...prev, agent_id: currentAgentId }));
        }
    }, [currentAgentId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tasksData, agentsData] = await Promise.all([
                ScheduledTask.list('-created_date'),
                Agent.list()
            ]);
            setTasks(tasksData);
            setAgents(agentsData);
        } catch (error) {
            console.error('Error loading scheduled tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.agent_id || !newTask.task_name || !newTask.workflow_definition) {
            alert('אנא מלא את כל השדות: שם המשימה, סוכן, והוראות.');
            return;
        }

        try {
            const nextRunAt = calculateNextRunTime(newTask.schedule_type, newTask.schedule_time, newTask.schedule_day);
            
            const taskData = {
                ...newTask,
                next_run_at: nextRunAt,
                last_run_status: 'pending',
                webhook_secret: newTask.webhook_trigger ? generateWebhookSecret() : null
            };

            await ScheduledTask.create(taskData);
            setShowAddForm(false);
            setNewTask({
                agent_id: currentAgentId || '',
                task_name: '',
                description: '',
                schedule_type: 'daily',
                schedule_time: '09:00',
                schedule_day: 1,
                workflow_definition: '',
                workflow_type: 'prompt',
                tools_to_use: [],
                webhook_trigger: false
            });
            loadData();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('שגיאה ביצירת המשימה');
        }
    };

    const handleToggleTask = async (task) => {
        try {
            await ScheduledTask.update(task.id, { 
                is_active: !task.is_active 
            });
            loadData();
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const handleRunTaskNow = async (task) => {
        try {
            setTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, last_run_status: 'running' } : t
            ));

            const response = await runScheduledTask({
                task_id: task.id,
                agent_id: task.agent_id,
                workflow_definition: task.workflow_definition,
                tools_to_use: task.tools_to_use || [],
                trigger_type: 'manual'
            });

            console.log('=== DEBUG: Task Response ===');
            console.log('Full response:', response);
            console.log('Response data:', response.data);

            if (response.data && response.data.success) {
                alert('✅ המשימה בוצעה בהצלחה!');
            } else {
                // --- FIX: Improved and more robust error message display ---
                const errorMsg = response.data?.error || response.data?.message || 'שגיאה לא ידועה מהשרת. בדוק את ה-logs לפרטים נוספים.';
                alert(`❌ המשימה נכשלה:\n${errorMsg}`);
            }
            
            loadData();
        } catch (error) {
            console.error('=== ERROR in handleRunTaskNow ===');
            console.error('Error object:', error);
            console.error('Error response:', error.response);
            console.error('Error response data:', error.response?.data);
            
            let errorMessage = 'שגיאה לא ידועה';
            
            if (error.response && error.response.data) {
                errorMessage = error.response.data.error || error.response.data.message || 'שגיאה מהשרת';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(`❌ שגיאה בביצוע המשימה:\n${errorMessage}`);
            loadData();
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
            try {
                await ScheduledTask.delete(taskId);
                loadData();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const calculateNextRunTime = (scheduleType, scheduleTime, scheduleDay) => {
        const now = new Date();
        const [hours, minutes] = scheduleTime.split(':').map(Number);
        
        let nextRun = new Date();
        nextRun.setHours(hours, minutes, 0, 0);

        switch (scheduleType) {
            case 'daily':
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }
                break;
            case 'weekly':
                const targetDay = scheduleDay;
                const currentDay = nextRun.getDay();
                let daysUntilTarget = (targetDay - currentDay + 7) % 7;
                if (daysUntilTarget === 0 && nextRun <= now) {
                    daysUntilTarget = 7;
                }
                nextRun.setDate(nextRun.getDate() + daysUntilTarget);
                break;
            case 'monthly':
                nextRun.setDate(scheduleDay);
                if (nextRun <= now) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
                break;
        }

        return nextRun.toISOString();
    };

    const generateWebhookSecret = () => {
        return 'wh_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'bg-green-500/20 text-green-400';
            case 'failed': return 'bg-red-500/20 text-red-400';
            case 'running': return 'bg-blue-500/20 text-blue-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return <CheckCircle className="w-3 h-3" />;
            case 'failed': return <XCircle className="w-3 h-3" />;
            case 'running': return <Loader2 className="w-3 h-3 animate-spin" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    if (loading) {
        return (
            <Card className="glass border-white/20 w-80">
                <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass border-white/20 w-80 max-w-80">
            <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        משימות מתוזמנות
                    </CardTitle>
                    <Button 
                        size="sm" 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="gradient-primary text-white text-xs"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        {showAddForm ? 'סגור' : 'הוסף'}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-3 space-y-3">
                {showAddForm && (
                    <div className="p-3 glass rounded-lg border border-white/10 space-y-3">
                        <div className="space-y-3">
                            <div>
                                <Label className="text-white/80 text-xs">שם המשימה</Label>
                                <Input
                                    placeholder="מעקב יומי אחר לידים"
                                    value={newTask.task_name}
                                    onChange={(e) => setNewTask({...newTask, task_name: e.target.value})}
                                    className="glass border-white/20 text-white text-xs h-8"
                                />
                            </div>

                            <div>
                                <Label className="text-white/80 text-xs">סוכן</Label>
                                <Select value={newTask.agent_id} onValueChange={(value) => setNewTask({...newTask, agent_id: value})}>
                                    <SelectTrigger className="glass border-white/20 text-white text-xs h-8">
                                        <SelectValue placeholder="בחר סוכן" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-white/20">
                                        {agents.map(agent => (
                                            <SelectItem key={agent.id} value={agent.id} className="text-white text-xs">
                                                {agent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-white/80 text-xs">תדירות</Label>
                                    <Select value={newTask.schedule_type} onValueChange={(value) => setNewTask({...newTask, schedule_type: value})}>
                                        <SelectTrigger className="glass border-white/20 text-white text-xs h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-white/20">
                                            <SelectItem value="daily" className="text-white text-xs">יומי</SelectItem>
                                            <SelectItem value="weekly" className="text-white text-xs">שבועי</SelectItem>
                                            <SelectItem value="monthly" className="text-white text-xs">חודשי</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-white/80 text-xs">שעה</Label>
                                    <Input
                                        type="time"
                                        value={newTask.schedule_time}
                                        onChange={(e) => setNewTask({...newTask, schedule_time: e.target.value})}
                                        className="glass border-white/20 text-white text-xs h-8"
                                    />
                                </div>
                            </div>

                            {newTask.schedule_type === 'weekly' && (
                                <div>
                                    <Label className="text-white/80 text-xs">יום בשבוע</Label>
                                    <Select value={newTask.schedule_day?.toString()} onValueChange={(value) => setNewTask({...newTask, schedule_day: parseInt(value, 10)})}>
                                        <SelectTrigger className="glass border-white/20 text-white text-xs h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-white/20">
                                            <SelectItem value="0" className="text-white text-xs">ראשון</SelectItem>
                                            <SelectItem value="1" className="text-white text-xs">שני</SelectItem>
                                            <SelectItem value="2" className="text-white text-xs">שלישי</SelectItem>
                                            <SelectItem value="3" className="text-white text-xs">רביעי</SelectItem>
                                            <SelectItem value="4" className="text-white text-xs">חמישי</SelectItem>
                                            <SelectItem value="5" className="text-white text-xs">שישי</SelectItem>
                                            <SelectItem value="6" className="text-white text-xs">שבת</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {newTask.schedule_type === 'monthly' && (
                                <div>
                                    <Label className="text-white/80 text-xs">יום בחודש</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={newTask.schedule_day}
                                        onChange={(e) => setNewTask({...newTask, schedule_day: Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1))})}
                                        className="glass border-white/20 text-white text-xs h-8"
                                    />
                                </div>
                            )}

                            <div>
                                <Label className="text-white/80 text-xs">הוראות למשימה</Label>
                                <Textarea
                                    placeholder="שלח מייל מעקב לכל הלידים החדשים"
                                    value={newTask.workflow_definition}
                                    onChange={(e) => setNewTask({...newTask, workflow_definition: e.target.value})}
                                    className="glass border-white/20 text-white h-16 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label className="text-white/80 text-xs">אפשר Webhook</Label>
                                <Switch
                                    checked={newTask.webhook_trigger}
                                    onCheckedChange={(checked) => setNewTask({...newTask, webhook_trigger: checked})}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleCreateTask} className="gradient-primary text-white flex-1 text-xs h-8">
                                צור משימה
                            </Button>
                            <Button variant="ghost" onClick={() => setShowAddForm(false)} className="text-white text-xs h-8">
                                ביטול
                            </Button>
                        </div>
                    </div>
                )}

                {/* Task list with controlled height and width */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {tasks.length === 0 && !showAddForm ? (
                        <div className="text-center py-6 text-white/60">
                            <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p className="text-xs">אין משימות מתוזמנות</p>
                            <p className="text-xs mt-1 opacity-70">לחץ על 'הוסף' ליצירת משימה.</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className="p-3 glass-hover rounded-lg border border-white/10">
                                <div className="flex items-start justify-between mb-2">
                                    {/* --- FIX: Added min-w-0 to prevent flexbox overflow --- */}
                                    <div className="flex-1 min-w-0"> 
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-white font-medium text-sm truncate">{task.task_name}</h4>
                                            {task.webhook_trigger && (
                                                <Badge variant="outline" className="text-xs border-blue-400 text-blue-400 px-1 py-0 flex-shrink-0">
                                                    <Globe className="w-2 h-2 mr-1" />
                                                    Webhook
                                                </Badge>
                                            )}
                                        </div>
                                        {/* --- FIX: Applied word-wrap to description --- */}
                                        <p className="text-white/60 text-xs mb-2 break-words leading-relaxed">
                                            {task.description || task.workflow_definition}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-white/50">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-2 h-2" />
                                                {task.schedule_type} ב-{task.schedule_time}
                                            </span>
                                            <Badge className={getStatusColor(task.last_run_status) + ' text-xs px-1 py-0'}>
                                                {getStatusIcon(task.last_run_status)}
                                                {task.last_run_status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={task.is_active}
                                        onCheckedChange={() => handleToggleTask(task)}
                                        size="sm"
                                        className="flex-shrink-0 ml-2"
                                    />
                                </div>
                                
                                <div className="flex gap-1 mt-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => handleRunTaskNow(task)}
                                        className="text-white/70 hover:text-white flex-1 text-xs h-7"
                                        disabled={task.last_run_status === 'running'}
                                    >
                                        <Play className="w-2 h-2 mr-1" />
                                        הרץ עכשיו
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-red-400 hover:text-red-300 text-xs h-7"
                                    >
                                        <Trash2 className="w-2 h-2" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
