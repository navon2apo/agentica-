import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Sparkles } from 'lucide-react';

export default function CreateAgentModal({ isOpen, onClose, onSubmit, templates }) {
    const [formData, setFormData] = useState({
        name: '',
        template_id: '',
        personality: '',
        domain_expertise: [],
        response_style: 'professional'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({
            name: '',
            template_id: '',
            personality: '',
            domain_expertise: [],
            response_style: 'professional'
        });
    };

    const handleExpertiseChange = (value) => {
        const expertise = value.split(',').map(item => item.trim()).filter(Boolean);
        setFormData({ ...formData, domain_expertise: expertise });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-white/20 text-white" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Bot className="w-6 h-6 text-indigo-400" />
                        צור סוכן AI חדש
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 p-1">
                    <div className="space-y-2">
                        <Label className="text-white/80">שם הסוכן</Label>
                        <Input
                            placeholder="הכנס שם לסוכן שלך..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="glass border-white/20 text-white"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/80">תבנית</Label>
                        <Select value={formData.template_id} onValueChange={(value) => setFormData({ ...formData, template_id: value })} required>
                            <SelectTrigger className="glass border-white/20 text-white">
                                <SelectValue placeholder="בחר תבנית סוכן" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-white/20">
                                {templates.map((template) => (
                                    <SelectItem key={template.id} value={template.id} className="text-white hover:bg-gray-700">
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/80">אישיות</Label>
                        <Textarea
                            placeholder="תאר את האישיות והסגנון של הסוכן..."
                            value={formData.personality}
                            onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                            className="glass border-white/20 text-white h-24"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/80">תחומי מומחיות</Label>
                        <Input
                            placeholder="שירות לקוחות, מכירות... (הפרד בפסיקים)"
                            value={formData.domain_expertise.join(', ')}
                            onChange={(e) => handleExpertiseChange(e.target.value)}
                            className="glass border-white/20 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/80">סגנון תגובה</Label>
                        <Select value={formData.response_style} onValueChange={(value) => setFormData({ ...formData, response_style: value })}>
                            <SelectTrigger className="glass border-white/20 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-white/20">
                                <SelectItem value="professional" className="text-white">מקצועי</SelectItem>
                                <SelectItem value="friendly" className="text-white">ידידותי</SelectItem>
                                <SelectItem value="technical" className="text-white">טכני</SelectItem>
                                <SelectItem value="casual" className="text-white">רגיל</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 border border-white/20 text-white">
                            ביטול
                        </Button>
                        <Button type="submit" className="flex-1 gradient-primary text-white">
                            <Sparkles className="w-4 h-4 mr-2" />
                            צור סוכן
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}