import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Star, 
    Download, 
    Eye,
    Wrench
} from 'lucide-react';

export default function TemplateCard({ template }) {
    return (
        <Card className="glass border-white/20 hover:bg-white/10 transition-all group">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div 
                            className={`w-12 h-12 rounded-xl flex items-center justify-center`}
                            style={{backgroundColor: template.color ? template.color + '40' : '#8b5cf640'}}
                        >
                            <span className="text-2xl">{template.icon}</span>
                        </div>
                        <div>
                            <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                            <Badge variant="outline" className="border-white/20 text-white/70 text-xs mt-1">
                                {template.category}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white/60 text-sm">{template.popularity_score || 0}</span>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <p className="text-white/70 text-sm leading-relaxed h-20 overflow-hidden">{template.description}</p>

                {template.required_expertise && template.required_expertise.length > 0 && (
                    <div>
                        <p className="text-white/80 text-xs mb-2">מומחיות נדרשת:</p>
                        <div className="flex flex-wrap gap-1">
                            {template.required_expertise.slice(0, 3).map((expertise, index) => (
                                <Badge key={index} variant="outline" className="border-white/20 text-white/60 text-xs">
                                    {expertise}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {template.available_tools && template.available_tools.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-white/60" />
                        <span className="text-white/60 text-xs">{template.available_tools.length} כלים זמינים</span>
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 glass-hover border border-white/20 text-white"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        תצוגה מקדימה
                    </Button>
                    <Button 
                        size="sm"
                        className="flex-1 gradient-primary text-white"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        השתמש
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}