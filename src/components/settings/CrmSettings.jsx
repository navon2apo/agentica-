import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Database } from 'lucide-react';

export default function CrmSettings() {
    const [customLabels, setCustomLabels] = useState({
        custom_field_1_label: 'שדה מותאם 1',
        custom_field_2_label: 'שדה מותאם 2',
        custom_field_3_label: 'שדה מותאם 3',
        custom_field_4_label: 'שדה מותאם 4',
        custom_field_5_label: 'שדה מותאם 5'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
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
                console.error('Error loading CRM settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await User.updateMyUserData(customLabels);
            alert('הגדרות CRM נשמרו בהצלחה!');
        } catch (error) {
            console.error('Error saving CRM settings:', error);
            alert('שגיאה בשמירת ההגדרות');
        } finally {
            setSaving(false);
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
        <Card className="glass border-white/20">
            <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    הגדרות CRM
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">שדות מותאמים אישית</h3>
                    <p className="text-white/70 text-sm mb-6">
                        התאם את שמות השדות המותאמים אישית ב-CRM שלך. השמות הללו יופיעו בטבלאות, טפסים ובכרטיסי לקוח.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4, 5].map(num => (
                            <div key={num} className="space-y-2">
                                <Label className="text-white/80">שדה מותאם {num}</Label>
                                <Input
                                    placeholder={`שם לשדה מותאם ${num}`}
                                    value={customLabels[`custom_field_${num}_label`]}
                                    onChange={(e) => setCustomLabels({
                                        ...customLabels,
                                        [`custom_field_${num}_label`]: e.target.value
                                    })}
                                    className="glass border-white/20 text-white"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        className="gradient-primary text-white"
                        disabled={saving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'שומר...' : 'שמור הגדרות'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}