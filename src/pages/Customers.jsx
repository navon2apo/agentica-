import React, { useState, useEffect } from 'react';
import { Customer } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Users, 
    Plus, 
    Search,
    LayoutGrid,
    List
} from 'lucide-react';
import CustomerCard from '@/components/customers/CustomerCard';
import CreateCustomerModal from '@/components/customers/CreateCustomerModal';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import CustomersTable from '@/components/customers/CustomersTable';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const customersData = await Customer.list('-last_interaction');
            setCustomers(customersData);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async (customerData) => {
        try {
            await Customer.create(customerData);
            setShowCreateModal(false);
            loadCustomers();
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('שגיאה ביצירת הלקוח');
        }
    };

    const handleEditCustomer = (customer) => {
        setEditingCustomer(customer);
        setShowEditModal(true);
    };

    const handleUpdateCustomer = async (customerId, customerData) => {
        try {
            await Customer.update(customerId, customerData);
            setShowEditModal(false);
            setEditingCustomer(null);
            loadCustomers();
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        all: customers.length,
        lead: customers.filter(c => c.status === 'lead').length,
        prospect: customers.filter(c => c.status === 'prospect').length,
        customer: customers.filter(c => c.status === 'customer').length,
        churned: customers.filter(c => c.status === 'churned').length
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">לקוחות</h1>
                <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="gradient-primary text-white"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    הוסף לקוח
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass border-white/20">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-white">{statusCounts.all}</p>
                        <p className="text-white/60 text-sm">סה"כ לקוחות</p>
                    </CardContent>
                </Card>
                <Card className="glass border-white/20">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{statusCounts.lead}</p>
                        <p className="text-white/60 text-sm">ליידים</p>
                    </CardContent>
                </Card>
                <Card className="glass border-white/20">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{statusCounts.prospect}</p>
                        <p className="text-white/60 text-sm">פרוספקטים</p>
                    </CardContent>
                </Card>
                <Card className="glass border-white/20">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">{statusCounts.customer}</p>
                        <p className="text-white/60 text-sm">לקוחות פעילים</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-4 flex-wrap justify-between items-center">
                <div className="flex gap-4 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                        <Input
                            placeholder="חפש לקוחות..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="glass border-white/20 text-white pr-10"
                            dir="rtl"
                        />
                    </div>

                    <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-auto">
                        <TabsList className="glass">
                            <TabsTrigger value="all" className="text-white">הכל</TabsTrigger>
                            <TabsTrigger value="lead" className="text-white">ליידים</TabsTrigger>
                            <TabsTrigger value="prospect" className="text-white">פרוספקטים</TabsTrigger>
                            <TabsTrigger value="customer" className="text-white">לקוחות</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button 
                        variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                        size="icon" 
                        onClick={() => setViewMode('grid')}
                        className={viewMode === 'grid' ? 'gradient-primary text-white' : 'glass-hover border border-white/20 text-white'}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant={viewMode === 'table' ? 'default' : 'ghost'} 
                        size="icon" 
                        onClick={() => setViewMode('table')}
                        className={viewMode === 'table' ? 'gradient-primary text-white' : 'glass-hover border border-white/20 text-white'}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map((customer) => (
                        <CustomerCard 
                            key={customer.id} 
                            customer={customer} 
                            onEdit={handleEditCustomer}
                        />
                    ))}
                </div>
            ) : (
                <CustomersTable 
                    customers={filteredCustomers} 
                    onEdit={handleEditCustomer}
                />
            )}

            {filteredCustomers.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <h3 className="text-xl font-semibold text-white mb-2">אין לקוחות</h3>
                    <p className="text-white/60 mb-6">התחל על ידי הוספת הלקוח הראשון שלך</p>
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="gradient-primary text-white"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        הוסף לקוח
                    </Button>
                </div>
            )}

            <CreateCustomerModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateCustomer}
            />

            <EditCustomerModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingCustomer(null);
                }}
                onSubmit={handleUpdateCustomer}
                customer={editingCustomer}
            />
        </div>
    );
}