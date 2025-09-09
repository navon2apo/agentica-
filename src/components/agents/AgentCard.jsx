import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Bot, 
    Play, 
    Pause, 
    MessageSquare,
    CheckCircle,
    AlertTriangle,
    Clock
} from 'lucide-react';

export default function AgentCard({ agent, onStatusToggle }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'training': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-3 h-3" />;
            case 'training': return <Clock className="w-3 h-3" />;
            default: return <AlertTriangle className="w-3 h-3" />;
        }
    };

    return (
        <Card className="glass border-white/20 hover:bg-white/10 transition-all group">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                            <p className="text-white/60 text-sm">{agent.personality || 'סוכן כללי'}</p>
                        </div>
                    </div>
                    <Badge className={getStatusColor(agent.status)}>
                        {getStatusIcon(agent.status)}
                        <span className="ml-1">{agent.status}</span>
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                            {agent.performance_metrics?.total_interactions || 0}
                        </p>
                        <p className="text-white/60 text-xs">אינטראקציות</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">
                            {(agent.performance_metrics?.success_rate || 0).toFixed(1)}%
                        </p>
                        <p className="text-white/60 text-xs">שיעור הצלחה</p>
                    </div>
                </div>

                {agent.domain_expertise && agent.domain_expertise.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {agent.domain_expertise.slice(0, 3).map((expertise, index) => (
                            <Badge key={index} variant="outline" className="border-white/20 text-white/70 text-xs">
                                {expertise}
                            </Badge>
                        ))}
                        {agent.domain_expertise.length > 3 && (
                            <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
                                +{agent.domain_expertise.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onStatusToggle(agent)}
                        className="flex-1 glass-hover border border-white/20 text-white"
                    >
                        {agent.status === 'active' ? (
                            <>
                                <Pause className="w-4 h-4 mr-2" />
                                השהה
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                הפעל
                            </>
                        )}
                    </Button>
                    <Link to={createPageUrl(`AgentChat?id=${agent.id}`)} className="flex-1">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full glass-hover border border-white/20 text-white"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            צ'אט
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}