import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Zap,
    Mail,
    Users,
    FileText,
    Calendar,
    CheckCircle,
    XCircle,
    Key,
    Save,
    Link,
    Unlink,
    Clock,
    Loader2,
    FolderOpen,
    Sheet
} from "lucide-react";

import { googleOAuth } from '@/api/functions';

export default function IntegrationSettings() {
    const [integrations, setIntegrations] = useState([
        {
            id: "google-services",
            name: "שירותי Google",
            description: "חבר את כל שירותי גוגל שלך: Gmail, Calendar, Drive, Sheets ועוד.",
            icon: Mail, // או אייקון גוגל כללי
            status: "checking",
            services: [
                { name: "Gmail", icon: Mail, description: "שליחה וקריאה של מיילים" },
                { name: "Google Calendar", icon: Calendar, description: "קביעת פגישות ובדיקת זמינות" },
                { name: "Google Drive", icon: FolderOpen, description: "גישה לקבצים בדרייב" },
                { name: "Google Sheets", icon: Sheet, description: "עבודה עם גיליונות אלקטרוניים" },
                { name: "Google Docs", icon: FileText, description: "עבודה עם מסמכי וורד" }
            ]
        },
        {
            id: "crm",
            name: "Built-in CRM",
            description: "נהל לקוחות ולידים ישירות בפלטפורמה. מחובר כברירת מחדל.",
            icon: Users,
            status: "connected",
        },
        {
            id: "docs",
            name: "Document AI",
            description: "תן לסוכנים יכולת להבין מסמכי PDF, תמונות ועוד.",
            icon: FileText,
            status: "connected",
        }
    ]);

    const [userApiKey, setUserApiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [connectingIntegration, setConnectingIntegration] = useState('');
    const authWindowCheckIntervalRef = useRef(null);

    const checkGoogleConnectionStatus = async () => {
        try {
            const response = await googleOAuth({ action: 'check_status' });
            const isConnected = response.data.connected;

            setIntegrations(prev =>
                prev.map(integration => {
                    if (integration.id === 'google-services') {
                        return { ...integration, status: isConnected ? 'connected' : 'available' };
                    }
                    return integration;
                })
            );
        } catch (error) {
            console.error('Failed to check Google connection status:', error);
            setIntegrations(prev =>
                prev.map(integration => {
                    if (integration.id === 'google-services') {
                        return { ...integration, status: 'available' };
                    }
                    return integration;
                })
            );
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = await User.me();
                if (currentUser && currentUser.openai_api_key) {
                    setUserApiKey(currentUser.openai_api_key);
                }

                await checkGoogleConnectionStatus();
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();

        const handleOAuthMessage = (event) => {
            if (event.origin === window.location.origin && event.data && event.data.type === 'oauth_complete') {
                console.log('OAuth flow completed successfully via postMessage.');
                if (authWindowCheckIntervalRef.current) {
                    clearInterval(authWindowCheckIntervalRef.current);
                    authWindowCheckIntervalRef.current = null;
                }
                setConnectingIntegration('');
                checkGoogleConnectionStatus();
            }
        };

        window.addEventListener('message', handleOAuthMessage);

        return () => {
            window.removeEventListener('message', handleOAuthMessage);
            if (authWindowCheckIntervalRef.current) {
                clearInterval(authWindowCheckIntervalRef.current);
                authWindowCheckIntervalRef.current = null;
            }
        };
    }, []);

    const handleConnectionToggle = async (integrationId) => {
        if (integrationId === 'crm' || integrationId === 'docs') {
            return;
        }

        if (integrationId === 'google-services') {
            setConnectingIntegration(integrationId);

            try {
                const integration = integrations.find(i => i.id === integrationId);

                if (integration.status === 'connected') {
                    // Disconnect
                    const response = await googleOAuth({ action: 'disconnect' });
                    if (response.data.success) {
                        alert('החיבור לשירותי Google נותק בהצלחה');
                        await checkGoogleConnectionStatus();
                    } else {
                        throw new Error('ניתוק החיבור נכשל.');
                    }
                    setConnectingIntegration('');
                } else {
                    // New connection
                    const response = await googleOAuth({
                        action: 'initiate',
                        integration_id: 'google-services'
                    });

                    if (response.data.success && response.data.authUrl) {
                        const authWindow = window.open(
                            response.data.authUrl,
                            'GoogleAuth',
                            'width=500,height=600,scrollbars=yes,resizable=yes'
                        );

                        const intervalId = setInterval(() => {
                            if (authWindow && authWindow.closed) {
                                clearInterval(intervalId);
                                authWindowCheckIntervalRef.current = null;
                                console.log('OAuth window closed. Checking status as fallback.');
                                checkGoogleConnectionStatus();
                                setConnectingIntegration('');
                            }
                        }, 1000);
                        authWindowCheckIntervalRef.current = intervalId;
                    } else {
                        throw new Error('Failed to generate authorization URL or missing authUrl.');
                    }
                }
            } catch (error) {
                console.error('Connection toggle failed:', error);
                alert(`שגיאה בחיבור: ${error.message}`);
                setConnectingIntegration('');
                if (authWindowCheckIntervalRef.current) {
                    clearInterval(authWindowCheckIntervalRef.current);
                    authWindowCheckIntervalRef.current = null;
                }
            }
        }
    };

    const handleSaveApiKey = async () => {
        try {
            await User.updateMyUserData({ openai_api_key: userApiKey });
            alert("API Key saved successfully!");
        } catch (error) {
            console.error("Failed to save API key", error);
            alert("Failed to save API key.");
        }
    };

    const statusInfo = {
        connected: { text: "מחובר", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
        available: { text: "זמין", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: null },
        checking: { text: "בודק...", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3 mr-1" /> },
        error: { text: "שגיאה", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3 mr-1" /> }
    };

    return (
        <div className="space-y-6">
            <Card className="glass border-white/20">
                <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-400" />
                        מפתח OpenAI API
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <p className="text-white/70">
                        כברירת מחדל, הסוכנים משתמשים במודל הבסיסי של הפלטפורמה. כדי להשתמש במודלים מתקדמים כמו GPT-4o, אנא ספק מפתח OpenAI API משלך.
                    </p>
                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                            <Label className="text-white/80">מפתח OpenAI API שלך</Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={userApiKey}
                                onChange={(e) => setUserApiKey(e.target.value)}
                                className="glass border-white/20 text-white"
                                disabled={loading}
                            />
                        </div>
                        <Button onClick={handleSaveApiKey} className="gradient-primary text-white" disabled={loading}>
                            <Save className="w-4 h-4 mr-2" />
                            שמור מפתח
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass border-white/20">
                <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        מרכז חיבורים
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        {integrations.map((integration) => {
                            const currentStatus = statusInfo[integration.status] || statusInfo.available;
                            const isConnectable = integration.id !== 'crm' && integration.id !== 'docs';
                            const isConnecting = connectingIntegration === integration.id;

                            return (
                                <div key={integration.id}>
                                    <div className="flex items-center justify-between p-4 glass-hover rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center">
                                                <integration.icon className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">{integration.name}</h3>
                                                <p className="text-white/70 text-sm">{integration.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={currentStatus.color}>
                                                {currentStatus.icon}
                                                {currentStatus.text}
                                            </Badge>
                                            {isConnectable && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="glass-hover border border-white/20 text-white w-32"
                                                    onClick={() => handleConnectionToggle(integration.id)}
                                                    disabled={isConnecting || integration.status === 'checking'}
                                                >
                                                    {isConnecting ? (
                                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> מתחבר...</>
                                                    ) : integration.status === 'connected' ? (
                                                        <><Unlink className="w-4 h-4 mr-2" /> נתק</>
                                                    ) : (
                                                        <><Link className="w-4 h-4 mr-2" /> חבר</>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Show Google services when connected */}
                                    {integration.id === 'google-services' && integration.status === 'connected' && integration.services && (
                                        <div className="mt-4 ml-16 space-y-2">
                                            <p className="text-white/60 text-sm font-medium">שירותים מחוברים:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {integration.services.map((service, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                                        <service.icon className="w-4 h-4 text-green-400" />
                                                        <div>
                                                            <p className="text-white text-sm font-medium">{service.name}</p>
                                                            <p className="text-white/60 text-xs">{service.description}</p>
                                                        </div>
                                                        <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}