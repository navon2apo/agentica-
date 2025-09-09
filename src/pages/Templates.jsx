import React, { useState, useEffect } from 'react';
import { AgentTemplate } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Book, 
    Plus, 
    Search, 
    Star,
    Download,
    Eye,
    Sparkles
} from 'lucide-react';
import TemplateCard from '@/components/templates/TemplateCard';

export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const templatesData = await AgentTemplate.list('-popularity_score');
            setTemplates(Array.isArray(templatesData) ? templatesData : []);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = Array.isArray(templates) ? templates.filter(template => {
        const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             template.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
        return matchesSearch && matchesCategory;
    }) : [];

    const categories = Array.isArray(templates) ? [...new Set(templates.map(t => t.category))].filter(Boolean) : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">תבניות סוכנים</h1>
                <Button className="gradient-primary text-white">
                    <Plus className="w-5 h-5 mr-2" />
                    צור תבנית חדשה
                </Button>
            </div>

            <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                    <Input
                        placeholder="חפש תבניות..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass border-white/20 text-white pr-10"
                        dir="rtl"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={categoryFilter === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCategoryFilter('all')}
                        className={categoryFilter === 'all' ? 'gradient-primary text-white' : 'glass-hover border border-white/20 text-white'}
                    >
                        הכל
                    </Button>
                    {categories.map(category => (
                        <Button
                            key={category}
                            variant={categoryFilter === category ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCategoryFilter(category)}
                            className={categoryFilter === category ? 'gradient-primary text-white' : 'glass-hover border border-white/20 text-white'}
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            <Card className="glass border-white/20">
                <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        תבניות מומלצות
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                     {loading ? <p className="text-white/60">טוען תבניות מומלצות...</p> :
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {templates.slice(0, 3).map((template) => (
                                <div key={template.id} className="p-4 glass-hover rounded-lg border border-white/10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{backgroundColor: template.color ? template.color + '40' : '#8b5cf640'}}>
                                            <span className="text-lg">{template.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{template.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <Star className="w-3 h-3 text-yellow-400" />
                                                <span className="text-white/60 text-xs">{template.popularity_score || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-white/70 text-sm mb-3 h-12 overflow-hidden">{template.description}</p>
                                    <Button size="sm" className="w-full gradient-primary text-white">
                                        <Download className="w-4 h-4 mr-2" />
                                        השתמש בתבנית
                                    </Button>
                                </div>
                            ))}
                        </div>
                    }
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            )}

            {filteredTemplates.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Book className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <h3 className="text-xl font-semibold text-white mb-2">לא נמצאו תבניות</h3>
                    <p className="text-white/60">נסה לשנות את מילות החיפוש או הפילטרים</p>
                </div>
            )}
        </div>
    );
}