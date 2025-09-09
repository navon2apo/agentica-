import React, { useState, useEffect } from 'react';
import { Agent } from '@/api/entities';
import { AgentTemplate } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Bot, 
    Plus, 
    Search
} from 'lucide-react';
import AgentCard from '@/components/agents/AgentCard';
import CreateAgentModal from '@/components/agents/CreateAgentModal';

export default function Agents() {
    const [agents, setAgents] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [agentsData, templatesData] = await Promise.all([
                Agent.list(),
                AgentTemplate.list()
            ]);
            setAgents(Array.isArray(agentsData) ? agentsData : []);
            setTemplates(Array.isArray(templatesData) ? templatesData : []);
        } catch (error) {
            console.error('Error loading agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAgent = async (agentData) => {
        await Agent.create(agentData);
        setShowCreateModal(false);
        loadData();
    };

    const handleStatusToggle = async (agent) => {
        const newStatus = agent.status === 'active' ? 'inactive' : 'active';
        await Agent.update(agent.id, { status: newStatus });
        loadData();
    };

    const filteredAgents = Array.isArray(agents) ? agents.filter(agent =>
        agent.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">סוכני AI</h1>
                <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="gradient-primary text-white"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    צור סוכן חדש
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                    <Input
                        placeholder="חפש סוכנים..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass border-white/20 text-white pr-10"
                        dir="rtl"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAgents.map((agent) => (
                        <AgentCard 
                            key={agent.id} 
                            agent={agent} 
                            onStatusToggle={handleStatusToggle}
                        />
                    ))}
                </div>
            )}

            {filteredAgents.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <h3 className="text-xl font-semibold text-white mb-2">אין סוכנים</h3>
                    <p className="text-white/60 mb-6">התחל על ידי יצירת הסוכן הראשון שלך</p>
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="gradient-primary text-white"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        צור סוכן חדש
                    </Button>
                </div>
            )}

            <CreateAgentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateAgent}
                templates={templates}
            />
        </div>
    );
}