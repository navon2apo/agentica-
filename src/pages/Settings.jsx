import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IntegrationSettings from '@/components/settings/IntegrationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import CrmSettings from '@/components/settings/CrmSettings';
import { SlidersHorizontal, Shield, Plug, Database } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="text-white">
            <h1 className="text-3xl font-bold mb-6">הגדרות</h1>
            <Tabs defaultValue="integrations" className="w-full">
                <TabsList className="grid w-full max-w-lg grid-cols-3 glass mb-6">
                    <TabsTrigger value="integrations">
                        <Plug className="w-4 h-4 mr-2" />
                        חיבורים
                    </TabsTrigger>
                    <TabsTrigger value="crm">
                        <Database className="w-4 h-4 mr-2" />
                        CRM
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="w-4 h-4 mr-2" />
                        אבטחה
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="integrations">
                    <IntegrationSettings />
                </TabsContent>
                <TabsContent value="crm">
                    <CrmSettings />
                </TabsContent>
                <TabsContent value="security">
                    <SecuritySettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}