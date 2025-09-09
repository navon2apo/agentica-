
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Agent } from '@/api/entities';
import { Customer } from '@/api/entities';
import { Activity } from '@/api/entities';
import { 
    Bot, 
    Users, 
    Activity as ActivityIcon, 
    TrendingUp, 
    CheckCircle,
    Clock,
    AlertTriangle,
    Zap,
    Mail, // Added Mail icon import
    Phone, // Added Phone icon import
    MessageSquare // Added MessageSquare icon import
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalAgents: 0,
        activeAgents: 0,
        totalCustomers: 0,
        totalActivities: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [agents, customers, activities] = await Promise.all([
                Agent.list(),
                Customer.list(),
                Activity.list('-created_date', 10)
            ]);

            setStats({
                totalAgents: agents.length,
                activeAgents: agents.filter(a => a.status === 'active').length,
                totalCustomers: customers.length,
                totalActivities: activities.length
            });

            setRecentActivities(activities);

            // Generate mock performance data
            const mockData = Array.from({ length: 7 }, (_, i) => ({
                day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL', { weekday: 'short' }),
                interactions: Math.floor(Math.random() * 100) + 20,
                success_rate: Math.floor(Math.random() * 30) + 70
            }));
            setPerformanceData(mockData);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'call': return <Phone className="w-4 h-4" />;
            case 'chat': return <MessageSquare className="w-4 h-4" />;
            default: return <ActivityIcon className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'bg-green-500/20 text-green-400';
            case 'failed': return 'bg-red-500/20 text-red-400';
            case 'in_progress': return 'bg-blue-500/20 text-blue-400';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">לוח בקרה</h1>
                <Badge className="glass text-white/80 px-3 py-1 w-fit">
                    עדכון אחרון: {new Date().toLocaleTimeString('he-IL')}
                </Badge>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card className="glass border-white/20 hover:bg-white/10 transition-all">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/70 text-xs lg:text-sm">סוכני AI פעילים</p>
                                <p className="text-2xl lg:text-3xl font-bold text-white">{stats.activeAgents}</p>
                                <p className="text-white/50 text-xs">מתוך {stats.totalAgents} סה"כ</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 gradient-primary rounded-xl flex items-center justify-center">
                                <Bot className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-white/20 hover:bg-white/10 transition-all">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/70 text-xs lg:text-sm">לקוחות</p>
                                <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalCustomers}</p>
                                <p className="text-green-400 text-xs flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +12% השבוע
                                </p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 gradient-success rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-white/20 hover:bg-white/10 transition-all">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/70 text-xs lg:text-sm">אינטראקציות היום</p>
                                <p className="text-2xl lg:text-3xl font-bold text-white">247</p>
                                <p className="text-blue-400 text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    זמן תגובה: 2.3 שניות
                                </p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-white/20 hover:bg-white/10 transition-all">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/70 text-xs lg:text-sm">שיעור הצלחה</p>
                                <p className="text-2xl lg:text-3xl font-bold text-white">94.2%</p>
                                <p className="text-green-400 text-xs flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    +2.1% מהחודש שעבר
                                </p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                <Card className="glass border-white/20">
                    <CardHeader className="border-b border-white/10 p-4 lg:p-6">
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                            <TrendingUp className="w-5 h-5" />
                            פעילות שבועית
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 lg:p-6">
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" />
                                <YAxis stroke="rgba(255,255,255,0.7)" />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(0,0,0,0.8)', 
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="interactions" 
                                    stroke="#4f46e5" 
                                    strokeWidth={3}
                                    dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass border-white/20">
                    <CardHeader className="border-b border-white/10 p-4 lg:p-6">
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                            <CheckCircle className="w-5 h-5" />
                            שיעור הצלחה יומי
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 lg:p-6">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" />
                                <YAxis stroke="rgba(255,255,255,0.7)" />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(0,0,0,0.8)', 
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar 
                                    dataKey="success_rate" 
                                    fill="url(#successGradient)"
                                    radius={[4, 4, 0, 0]}
                                />
                                <defs>
                                    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22c55e" />
                                        <stop offset="100%" stopColor="#16a34a" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities */}
            <Card className="glass border-white/20">
                <CardHeader className="border-b border-white/10 p-4 lg:p-6">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                        <ActivityIcon className="w-5 h-5" />
                        פעילויות אחרונות
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                    <div className="space-y-3 lg:space-y-4">
                        {recentActivities.length > 0 ? recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 lg:p-4 glass-hover rounded-lg">
                                <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-white font-medium text-sm lg:text-base truncate">{activity.action || 'פעילות חדשה'}</p>
                                        <p className="text-white/60 text-xs lg:text-sm truncate">{activity.description || 'אין תיאור'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                                    <Badge className={`${getStatusColor(activity.status)} text-xs`}>
                                        {activity.status}
                                    </Badge>
                                    <span className="text-white/50 text-xs hidden sm:block">
                                        {new Date(activity.created_date).toLocaleTimeString('he-IL')}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-white/60">
                                <ActivityIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>אין פעילויות אחרונות</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
