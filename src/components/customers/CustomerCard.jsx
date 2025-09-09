import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Users, 
    Building,
    Mail,
    Phone,
    Calendar,
    MessageSquare,
    ExternalLink,
    FileText,
    StickyNote,
    Edit
} from 'lucide-react';

export default function CustomerCard({ customer, onEdit }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'lead': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'prospect': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'customer': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'churned': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getSegmentColor = (segment) => {
        switch (segment) {
            case 'enterprise': return 'bg-purple-500/20 text-purple-400';
            case 'mid_market': return 'bg-indigo-500/20 text-indigo-400';
            case 'small_business': return 'bg-green-500/20 text-green-400';
            case 'startup': return 'bg-orange-500/20 text-orange-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const handleViewCustomer = () => {
        // כרגע נציג הודעה שהתכונה בפיתוח
        alert('עמוד פרטי לקוח בפיתוח - בקרוב!');
    };

    return (
        <Card className="glass border-white/20 hover:bg-white/10 transition-all group">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle className="text-white text-lg">{customer.name}</CardTitle>
                            {customer.company && (
                                <p className="text-white/60 text-sm flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {customer.company}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(customer)}
                            className="text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                    </div>
                    {customer.phone && (
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                        </div>
                    )}
                </div>

                {/* הצגת הערות או סיכום שיחה אם קיימים */}
                {(customer.notes || customer.call_summary) && (
                    <div className="space-y-2">
                        {customer.notes && (
                            <div className="flex items-start gap-2 text-white/70 text-xs">
                                <StickyNote className="w-3 h-3 mt-0.5" />
                                <span className="line-clamp-2">{customer.notes}</span>
                            </div>
                        )}
                        {customer.call_summary && (
                            <div className="flex items-start gap-2 text-white/70 text-xs">
                                <FileText className="w-3 h-3 mt-0.5" />
                                <span className="line-clamp-2">{customer.call_summary}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center">
                    {customer.segment && (
                        <Badge className={getSegmentColor(customer.segment)}>
                            {customer.segment}
                        </Badge>
                    )}
                    <div className="text-right">
                        <p className="text-lg font-bold text-white">{customer.total_interactions || 0}</p>
                        <p className="text-white/60 text-xs">אינטראקציות</p>
                    </div>
                </div>

                {customer.last_interaction && (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Calendar className="w-4 h-4" />
                        אינטראקציה: {new Date(customer.last_interaction).toLocaleDateString('he-IL')}
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 glass-hover border border-white/20 text-white"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        צ'אט
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleViewCustomer}
                        className="glass-hover border border-white/20 text-white"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}