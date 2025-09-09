import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Save, 
    FileText, 
    Upload, 
    Trash2,
    Loader2
} from "lucide-react";
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';

export default function AgentSettingsModal({ isOpen, onClose, agent, onSave }) {
    const [settings, setSettings] = useState({});
    const [knowledgeFiles, setKnowledgeFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (agent) {
            setSettings({
                name: agent.name || '',
                personality: agent.personality || '',
                system_prompt: agent.system_prompt || '',
                temperature: agent.temperature || 0.7,
            });
            setKnowledgeFiles(agent.knowledge_base || []);
        }
    }, [agent, isOpen]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            
            const extractionResult = await ExtractDataFromUploadedFile({
                file_url,
                json_schema: {
                    type: "object",
                    properties: {
                        content: {
                            type: "string",
                            description: "The full text content of the document."
                        }
                    }
                }
            });

            if (extractionResult.status === 'success' && extractionResult.output?.content) {
                const newFile = {
                    file_name: file.name,
                    file_url: file_url,
                    content: extractionResult.output.content,
                    uploaded_date: new Date().toISOString()
                };
                setKnowledgeFiles(prev => [...prev, newFile]);
            } else {
                 throw new Error(extractionResult.details || 'לא ניתן היה לחלץ תוכן מהקובץ.');
            }
        } catch (error) {
            console.error("File upload or extraction failed:", error);
            alert(`שגיאה בהעלאת הקובץ: ${error.message}`);
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveFile = (indexToRemove) => {
        setKnowledgeFiles(files => files.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = () => {
        onSave({ ...settings, knowledge_base: knowledgeFiles });
    };

    if (!agent) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl glass border-white/20 text-white" dir="rtl">
                <DialogHeader>
                    <DialogTitle>הגדרות סוכן: {agent.name}</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 glass mb-4">
                        <TabsTrigger value="general">כללי</TabsTrigger>
                        <TabsTrigger value="knowledge">מאגר ידע</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general">
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">שם הסוכן</Label>
                                <Input id="name" value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} className="glass border-white/20"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="personality">אישיות</Label>
                                <Textarea id="personality" value={settings.personality} onChange={(e) => setSettings({...settings, personality: e.target.value})} className="glass border-white/20"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="system_prompt">הנחיית מערכת (System Prompt)</Label>
                                <Textarea id="system_prompt" value={settings.system_prompt} onChange={(e) => setSettings({...settings, system_prompt: e.target.value})} className="glass border-white/20 h-24"/>
                            </div>
                             <div className="space-y-3">
                                <Label>טמפרטורה: {settings.temperature}</Label>
                                <Slider
                                    value={[settings.temperature]}
                                    onValueChange={(value) => setSettings({...settings, temperature: value[0]})}
                                    max={1}
                                    step={0.1}
                                />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="knowledge">
                       <div className="space-y-4 py-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">ניהול קבצים</h3>
                                <p className="text-sm text-white/60 mb-4">העלה לכאן קבצים (PDF, TXT, וכו') כדי להוסיף אותם לבסיס הידע של הסוכן. הסוכן ישתמש במידע זה כדי לענות על שאלות.</p>
                            </div>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {knowledgeFiles.length > 0 ? knowledgeFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 glass-hover rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-indigo-400" />
                                            <span className="text-sm">{file.file_name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)} className="text-red-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )) : (
                                    <p className="text-center text-white/50 text-sm py-4">מאגר הידע ריק.</p>
                                )}
                            </div>
                            
                            <Button
                                variant="outline"
                                className="w-full glass-hover border-dashed border-white/30"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        מעלה ומעבד...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        העלה קובץ למאגר הידע
                                    </>
                                )}
                            </Button>
                            <Input 
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,.txt,.docx"
                            />
                       </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">ביטול</Button>
                    </DialogClose>
                    <Button onClick={handleSave} className="gradient-primary text-white">
                        <Save className="w-4 h-4 mr-2"/>
                        שמור שינויים
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}