import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus } from 'lucide-react';
import { User } from '@/api/entities';

export default function CreateCustomerModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        segment: 'small_business',
        status: 'lead',
        notes: '',
        call_summary: '',
        custom_field_1: '',
        custom_field_2: '',
        custom_field_3: '',
        custom_field_4: '',
        custom_field_5: ''
    });

    const [customLabels, setCustomLabels] = useState({
        custom_field_1_label: 'שדה מותאם 1',
        custom_field_2_label: 'שדה מותאם 2',
        custom_field_3_label: 'שדה מותאם 3',
        custom_field_4_label: 'שדה מותאם 4',
        custom_field_5_label: 'שדה מותאם 5'
    });

    useEffect(() => {
        const loadCustomLabels = async () => {
            try {
                const user = await User.me();
                if (user) {
                    setCustomLabels({
                        custom_field_1_label: user.custom_field_1_label || 'שדה מותאם 1',
                        custom_field_2_label: user.custom_field_2_label || 'שדה מותאם 2',
                        custom_field_3_label: user.custom_field_3_label || 'שדה מותאם 3',
                        custom_field_4_label: user.custom_field_4_label || 'שדה מותאם 4',
                        custom_field_5_label: user.custom_field_5_label || 'שדה מותאם 5'
                    });
                }
            } catch (error) {
                console.error('Error loading custom labels:', error);
            }
        };

        if (isOpen) {
            loadCustomLabels();
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({ 
            name: '', 
            email: '', 
            company: '', 
            phone: '', 
            segment: 'small_business', 
            status: 'lead',
            notes: '',
            call_summary: '',
            custom_field_1: '',
            custom_field_2: '',
            custom_field_3: '',
            custom_field_4: '',
            custom_field_5: ''
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-gray-900 border-white/20 text-white max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Users className="w-6 h-6 text-indigo-400" />
                        הוסף לקוח חדש
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 p-1">
                    {/* שדות בסיסיים */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">שם מלא *</Label>
                            <Input
                                placeholder="הכנס שם מלא..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="glass border-white/20 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/80">אימייל *</Label>
                            <Input
                                type="email"
                                placeholder="example@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="glass border-white/20 text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">חברה *</Label>
                            <Input
                                placeholder="שם החברה..."
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="glass border-white/20 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/80">טלפון</Label>
                            <Input
                                placeholder="05X-XXXXXXX"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="glass border-white/20 text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">סטטוס</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger className="glass border-white/20 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-white/20">
                                    <SelectItem value="lead" className="text-white">ליד</SelectItem>
                                    <SelectItem value="prospect" className="text-white">פרוספקט</SelectItem>
                                    <SelectItem value="customer" className="text-white">לקוח</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/80">סגמנט</Label>
                            <Select value={formData.segment} onValueChange={(value) => setFormData({ ...formData, segment: value })}>
                                <SelectTrigger className="glass border-white/20 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-white/20">
                                    <SelectItem value="startup" className="text-white">סטארט-אפ</SelectItem>
                                    <SelectItem value="small_business" className="text-white">עסק קטן</SelectItem>
                                    <SelectItem value="mid_market" className="text-white">שוק בינוני</SelectItem>
                                    <SelectItem value="enterprise" className="text-white">ארגוני</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* הערות וסיכום שיחה */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">הערות</Label>
                            <Textarea
                                placeholder="הערות כלליות על הלקוח..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="glass border-white/20 text-white h-20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/80">סיכום שיחה</Label>
                            <Textarea
                                placeholder="סיכום שיחה או אינטראקציה..."
                                value={formData.call_summary}
                                onChange={(e) => setFormData({ ...formData, call_summary: e.target.value })}
                                className="glass border-white/20 text-white h-20"
                            />
                        </div>
                    </div>

                    {/* שדות מותאמים אישית */}
                    <div className="space-y-4">
                        <Label className="text-white/80 text-lg">שדות מותאמים אישית</Label>
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3, 4, 5].map(num => (
                                <div key={num} className="space-y-2">
                                    <Label className="text-white/80">{customLabels[`custom_field_${num}_label`]}</Label>
                                    <Input
                                        placeholder={`הכנס ${customLabels[`custom_field_${num}_label`]}...`}
                                        value={formData[`custom_field_${num}`]}
                                        onChange={(e) => setFormData({ ...formData, [`custom_field_${num}`]: e.target.value })}
                                        className="glass border-white/20 text-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 border border-white/20 text-white">
                            ביטול
                        </Button>
                        <Button type="submit" className="flex-1 gradient-primary text-white">
                            <UserPlus className="w-4 h-4 mr-2" />
                            הוסף לקוח
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}