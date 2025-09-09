import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
    Shield, 
    Key, 
    Plus, 
    Copy, 
    Trash2, 
    Eye,
    Save
} from "lucide-react";

export default function SecuritySettings() {
    const [enable2FA, setEnable2FA] = useState(true);
    const [apiKeys, setApiKeys] = useState([
        { id: 1, name: "Default Key", key: "sk-...", created: "2023-10-26" },
        { id: 2, name: "Marketing Bot Key", key: "sk-...", created: "2023-11-15" }
    ]);

    const handleGenerateKey = () => {
        const newKey = {
            id: apiKeys.length + 1,
            name: "New API Key",
            key: "sk-" + Math.random().toString(36).substr(2, 10),
            created: new Date().toISOString().split('T')[0]
        };
        setApiKeys([...apiKeys, newKey]);
    };

    return (
        <div className="space-y-6">
            <Card className="glass border-white/20">
                <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Authentication
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-white/80">Two-Factor Authentication (2FA)</Label>
                            <p className="text-white/60 text-sm">Add an extra layer of security to your account</p>
                        </div>
                        <Switch
                            checked={enable2FA}
                            onCheckedChange={setEnable2FA}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="glass border-white/20">
                <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        API Keys
                    </CardTitle>
                    <Button onClick={handleGenerateKey} className="gradient-primary text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Generate New Key
                    </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                    {apiKeys.map(apiKey => (
                        <div key={apiKey.id} className="flex items-center justify-between p-3 glass rounded-lg">
                            <div>
                                <p className="text-white font-medium">{apiKey.name}</p>
                                <p className="text-white/60 text-sm">Created on {apiKey.created}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input value={apiKey.key} readOnly className="glass border-white/20 text-white w-48" />
                                <Button variant="ghost" size="icon" className="text-white/70"><Copy className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button className="gradient-success text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Settings
                </Button>
            </div>
        </div>
    );
}