
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    LayoutDashboard, 
    Bot, 
    Users, 
    Book, 
    Settings, 
    Bell,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
    { name: 'לוח בקרה', icon: LayoutDashboard, path: 'Dashboard' },
    { name: 'סוכנים', icon: Bot, path: 'Agents' },
    { name: 'לקוחות', icon: Users, path: 'Customers' },
    { name: 'תבניות', icon: Book, path: 'Templates' },
    { name: 'הגדרות', icon: Settings, path: 'Settings' },
];

export default function Layout({ children, currentPageName }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen w-full flex bg-gray-900 text-white font-sans" dir="rtl">
            <style jsx global>{`
                .glass {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .glass-hover:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                .gradient-primary {
                    background-image: linear-gradient(to left, #4f46e5, #7c3aed);
                }
                .gradient-success {
                    background-image: linear-gradient(to left, #16a34a, #22c55e);
                }
            `}</style>
            
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 glass p-4 flex-col fixed h-full right-0 z-40">
                <div className="text-2xl font-bold mb-10 flex items-center gap-2">
                    <Bot className="w-8 h-8 text-indigo-400"/>
                    <span>AgentForge</span>
                </div>
                <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => {
                        const isActive = currentPageName === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={createPageUrl(item.path)}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/70 hover:bg-white/5'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="mt-auto p-4 glass rounded-xl">
                    <h4 className="font-semibold">שדרג ל-Pro</h4>
                    <p className="text-sm text-white/60 mt-1 mb-3">פתח תכונות מתקדמות ויכולות סוכן משופרות.</p>
                    <button className="w-full gradient-primary text-white font-semibold py-2 rounded-lg text-sm">
                        שדרג עכשיו
                    </button>
                </div>
            </aside>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
                    <aside className="relative w-64 glass p-4 flex flex-col h-full right-0">
                        <div className="flex items-center justify-between mb-6">
                            <div className="text-xl font-bold flex items-center gap-2">
                                <Bot className="w-6 h-6 text-indigo-400"/>
                                <span>AgentForge</span>
                            </div>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 rounded-lg glass-hover"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="flex flex-col space-y-2 flex-1">
                            {navItems.map((item) => {
                                const isActive = currentPageName === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={createPageUrl(item.path)}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                            isActive
                                                ? 'bg-white/10 text-white'
                                                : 'text-white/70 hover:bg-white/5'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>
                </div>
            )}

            <main className="flex-1 lg:mr-64 flex flex-col">
                <header className="sticky top-0 z-30 glass h-16 flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <button 
                            className="lg:hidden p-2 rounded-lg glass-hover"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="lg:hidden">
                            <span className="text-lg font-semibold">AgentForge</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-4">
                        <button className="text-white/70 hover:text-white p-2">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                <AvatarFallback>מנ</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium hidden sm:block">משתמש מנהל</span>
                            <ChevronDown className="w-4 h-4 text-white/70 hidden sm:block"/>
                        </div>
                    </div>
                </header>
                <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto" style={{background: 'radial-gradient(circle, rgba(23,23,31,1) 0%, rgba(17,17,23,1) 100%)'}}>
                    {children}
                </div>
            </main>
        </div>
    );
}
