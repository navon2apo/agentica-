import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Edit } from 'lucide-react';
import { User } from '@/api/entities';

export default function CustomersTable({ customers, onEdit }) {
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

        loadCustomLabels();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'lead': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'prospect': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'customer': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'churned': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <Card className="glass border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b-white/10">
                            <TableHead className="text-white/80">שם</TableHead>
                            <TableHead className="text-white/80">חברה</TableHead>
                            <TableHead className="text-white/80">אימייל</TableHead>
                            <TableHead className="text-white/80">טלפון</TableHead>
                            <TableHead className="text-white/80">סטטוס</TableHead>
                            <TableHead className="text-white/80">הערות</TableHead>
                            <TableHead className="text-white/80">{customLabels.custom_field_1_label}</TableHead>
                            <TableHead className="text-white/80">{customLabels.custom_field_2_label}</TableHead>
                            <TableHead className="text-white/80">{customLabels.custom_field_3_label}</TableHead>
                            <TableHead className="text-white/80">{customLabels.custom_field_4_label}</TableHead>
                            <TableHead className="text-white/80">{customLabels.custom_field_5_label}</TableHead>
                            <TableHead className="text-right text-white/80">אינטראקציה אחרונה</TableHead>
                            <TableHead className="text-center text-white/80">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id} className="border-b-white/10 hover:bg-white/5">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-9 h-9">
                                            <AvatarFallback className="bg-indigo-500/30 text-indigo-300">
                                                {getInitials(customer.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-white">{customer.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-white/70">{customer.company || '-'}</TableCell>
                                <TableCell className="text-white/70">{customer.email}</TableCell>
                                <TableCell className="text-white/70">{customer.phone || '-'}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(customer.status)}>
                                        {customer.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-white/70 max-w-32 truncate" title={customer.notes}>
                                    {customer.notes || '-'}
                                </TableCell>
                                <TableCell className="text-white/70 max-w-32 truncate" title={customer.custom_field_1}>
                                    {customer.custom_field_1 || '-'}
                                </TableCell>
                                <TableCell className="text-white/70 max-w-32 truncate" title={customer.custom_field_2}>
                                    {customer.custom_field_2 || '-'}
                                </TableCell>
                                <TableCell className="text-white/70 max-w-32 truncate" title={customer.custom_field_3}>
                                    {customer.custom_field_3 || '-'}
                                </TableCell>
                                <TableCell className="text-white/70 max-w-32 truncate" title={customer.custom_field_4}>
                                    {customer.custom_field_4 || '-'}
                                </TableCell>
                                <TableCell className="text-white/70 max-w-32 truncate" title={customer.custom_field_5}>
                                    {customer.custom_field_5 || '-'}
                                </TableCell>
                                <TableCell className="text-right text-white/70">
                                    {customer.last_interaction 
                                        ? new Date(customer.last_interaction).toLocaleDateString('he-IL') 
                                        : 'אין'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => onEdit(customer)}
                                        className="text-gray-400 hover:text-white hover:bg-white/10"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}