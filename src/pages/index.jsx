import Layout from "./Layout.jsx";

import Settings from "./Settings";

import Dashboard from "./Dashboard";

import Agents from "./Agents";

import Customers from "./Customers";

import Templates from "./Templates";

import AgentChat from "./AgentChat";

import AuthGoogleCallback from "./AuthGoogleCallback";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Settings: Settings,
    
    Dashboard: Dashboard,
    
    Agents: Agents,
    
    Customers: Customers,
    
    Templates: Templates,
    
    AgentChat: AgentChat,
    
    AuthGoogleCallback: AuthGoogleCallback,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Settings />} />
                
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Agents" element={<Agents />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/Templates" element={<Templates />} />
                
                <Route path="/AgentChat" element={<AgentChat />} />
                
                <Route path="/AuthGoogleCallback" element={<AuthGoogleCallback />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}