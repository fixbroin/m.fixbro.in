'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Users } from "lucide-react";
import PopupList from "./PopupList";
import LeadsList from "./LeadsList";
import PopupForm from "./PopupForm";
import { getPopups, getPopupLeads } from "./actions";

export default function PopupsPage() {
    const [popups, setPopups] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPopup, setEditingPopup] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        const [popupsData, leadsData] = await Promise.all([
            getPopups(),
            getPopupLeads()
        ]);
        setPopups(popupsData);
        setLeads(leadsData);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddPopup = () => {
        setEditingPopup(null);
        setIsFormOpen(true);
    };

    const handleEditPopup = (popup: any) => {
        setEditingPopup(popup);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingPopup(null);
        fetchData();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Popup Manager</h1>
                    <p className="text-muted-foreground">Manage your website's popups and captured leads.</p>
                </div>
                <Button onClick={handleAddPopup} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Add New Popup
                </Button>
            </div>

            <Tabs defaultValue="popups" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
                    <TabsTrigger value="popups" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Popups
                    </TabsTrigger>
                    <TabsTrigger value="leads" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Leads
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="popups" className="space-y-4">
                    <PopupList 
                        popups={popups} 
                        onEdit={handleEditPopup} 
                        onRefresh={fetchData} 
                        isLoading={isLoading} 
                    />
                </TabsContent>

                <TabsContent value="leads" className="space-y-4">
                    <LeadsList 
                        leads={leads} 
                        isLoading={isLoading} 
                        onRefresh={fetchData}
                    />
                </TabsContent>
            </Tabs>

            <PopupForm 
                isOpen={isFormOpen} 
                onClose={handleFormClose} 
                popup={editingPopup} 
            />
        </div>
    );
}
