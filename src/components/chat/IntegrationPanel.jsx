
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
    Users, 
    Mail, 
    Calendar, 
    Zap,
    FolderOpen,
    Sheet
} from "lucide-react";

export default function IntegrationPanel({ onIntegrationChange, googleConnected }) {
    const [serviceToggles, setServiceToggles] = useState({
        crm: true,
        google: true,
    });

    useEffect(() => {
        const activeIntegrations = [];
        if (serviceToggles.crm) {
            activeIntegrations.push('crm');
        }
        if (serviceToggles.google && googleConnected) {
            activeIntegrations.push('gmail', 'calendar', 'drive', 'sheets', 'docs');
        }
        onIntegrationChange(activeIntegrations);
    }, [serviceToggles, googleConnected, onIntegrationChange]);

    const handleToggle = (service) => {
        setServiceToggles(prev => ({ ...prev, [service]: !prev[service] }));
    };

    const googleServices = [
        { name: 'Gmail', icon: Mail },
        { name: 'Calendar', icon: Calendar },
        { name: 'Drive', icon: FolderOpen },
        { name: 'Sheets', icon: Sheet },
        { name: 'Docs', icon: Users } // Using Users icon for now, can be changed
    ];

    return (
        <Card className="glass border-white/20 w-full">
            <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    כלים פעילים
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between p-3 glass-hover rounded-lg">
                    <Label htmlFor="crm-toggle" className="flex items-center gap-3 cursor-pointer">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-medium">מערכת CRM</span>
                    </Label>
                    <Switch
                        id="crm-toggle"
                        checked={serviceToggles.crm}
                        onCheckedChange={() => handleToggle('crm')}
                    />
                </div>

                <div className="p-3 glass-hover rounded-lg">
                    <div className="flex items-center justify-between">
                         <Label htmlFor="google-toggle" className="flex items-center gap-3 cursor-pointer">
                            <Mail className="w-5 h-5 text-red-400" />
                            <span className="text-white font-medium">שירותי Google</span>
                        </Label>
                        <Switch
                            id="google-toggle"
                            checked={serviceToggles.google && googleConnected}
                            onCheckedChange={() => handleToggle('google')}
                            disabled={!googleConnected}
                        />
                    </div>
                    {googleConnected && serviceToggles.google && (
                        <div className="mt-3 space-y-2 pl-8">
                            {googleServices.map(service => (
                                <div key={service.name} className="flex items-center gap-2 text-sm text-white/70">
                                    <service.icon className="w-4 h-4" />
                                    <span>{service.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {!googleConnected && (
                         <p className="text-xs text-yellow-400/80 mt-2 pl-8">יש להתחבר לשירותי גוגל בהגדרות כדי להפעיל כלים אלו.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
