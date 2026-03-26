'use client';

import { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { savePopup, uploadFile, deleteFile } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Loader2 } from "lucide-react";

interface PopupFormProps {
    isOpen: boolean;
    onClose: () => void;
    popup?: any;
}

export default function PopupForm({ isOpen, onClose, popup }: PopupFormProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [formData, setFormData] = useState<any>({
        name: '',
        type: 'welcome',
        trigger_type: 'on_load',
        trigger_value: 3,
        pages: ['all'],
        devices: 'all',
        title: '',
        description: '',
        media_type: 'image',
        media_url: '',
        cta_text: '',
        cta_link: '',
        show_form: false,
        form_fields: { name: true, email: true, phone: false },
        frequency: 'once',
        is_active: true
    });

    useEffect(() => {
        if (popup) {
            setFormData({
                ...popup,
                pages: typeof popup.pages === 'string' ? JSON.parse(popup.pages) : (popup.pages || ['all']),
                form_fields: typeof popup.form_fields === 'string' ? JSON.parse(popup.form_fields) : (popup.form_fields || { name: true, email: true, phone: false }),
                is_active: popup.is_active === 1 || popup.is_active === true
            });
        } else {
            setFormData({
                name: '',
                type: 'welcome',
                trigger_type: 'on_load',
                trigger_value: 3,
                pages: ['all'],
                devices: 'all',
                title: '',
                description: '',
                media_type: 'image',
                media_url: '',
                cta_text: '',
                cta_link: '',
                show_form: false,
                form_fields: { name: true, email: true, phone: false },
                frequency: 'once',
                is_active: true
            });
        }
    }, [popup, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const res = await savePopup(formData);
        
        if (res.success) {
            toast({ title: "Success", description: "Popup saved successfully." });
            onClose();
        } else {
            toast({ title: "Error", description: "Failed to save popup.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleFormFieldChange = (field: string, checked: boolean) => {
        setFormData((prev: any) => ({
            ...prev,
            form_fields: { ...prev.form_fields, [field]: checked }
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Store old URL for cleanup
        const oldUrl = formData.media_url;

        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await uploadFile(uploadFormData);
            if (res.success && res.url) {
                // Delete old file if it exists and is local
                if (oldUrl) {
                    await deleteFile(oldUrl);
                }
                
                setFormData(prev => ({ ...prev, media_url: res.url }));
                toast({ title: "Success", description: "Media uploaded successfully." });
            } else {
                toast({ title: "Upload Failed", description: res.error || "Failed to upload file.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred during upload.", variant: "destructive" });
        } finally {
            setIsUploading(false);
            // Reset input so the same file can be uploaded again if needed
            e.target.value = '';
        }
    };

    const handleRemoveMedia = async () => {
        const url = formData.media_url;
        if (!url) return;

        try {
            await deleteFile(url);
            setFormData(prev => ({ ...prev, media_url: '' }));
            toast({ title: "Success", description: "Media removed successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete file from storage.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 gap-0 border-none">
                <DialogHeader className="px-6 py-6 border-b sticky top-0 bg-background z-10">
                    <DialogTitle className="text-2xl font-bold">{popup ? 'Edit Popup' : 'Create New Popup'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="px-6 py-6 space-y-8">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 h-auto p-1 bg-muted/50 rounded-xl mb-8">
                                <TabsTrigger value="basic" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Basic Info</TabsTrigger>
                                <TabsTrigger value="trigger" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Trigger</TabsTrigger>
                                <TabsTrigger value="content" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Content</TabsTrigger>
                                <TabsTrigger value="form" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">CTA & Form</TabsTrigger>
                            </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Popup Name (Internal)</Label>
                                    <Input 
                                        id="name" 
                                        value={formData.name} 
                                        onChange={(e) => handleChange('name', e.target.value)} 
                                        placeholder="e.g., Summer Sale Welcome"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Popup Type</Label>
                                    <Select 
                                        value={formData.type} 
                                        onValueChange={(val) => handleChange('type', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="welcome">Welcome</SelectItem>
                                            <SelectItem value="exit">Exit Intent</SelectItem>
                                            <SelectItem value="promotion">Promotion</SelectItem>
                                            <SelectItem value="newsletter">Newsletter</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequency</Label>
                                    <Select 
                                        value={formData.frequency} 
                                        onValueChange={(val) => handleChange('frequency', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="once">Show only once</SelectItem>
                                            <SelectItem value="daily">Show once per day</SelectItem>
                                            <SelectItem value="always">Always show</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Switch 
                                        id="is_active" 
                                        checked={formData.is_active} 
                                        onCheckedChange={(val) => handleChange('is_active', val)}
                                    />
                                    <Label htmlFor="is_active">Active Status</Label>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="trigger" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="trigger_type">Trigger Type</Label>
                                    <Select 
                                        value={formData.trigger_type} 
                                        onValueChange={(val) => handleChange('trigger_type', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select trigger" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="on_load">On Page Load</SelectItem>
                                            <SelectItem value="delay">After Delay (seconds)</SelectItem>
                                            <SelectItem value="scroll">After Scroll (%)</SelectItem>
                                            <SelectItem value="exit">Exit Intent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(formData.trigger_type === 'delay' || formData.trigger_type === 'scroll') && (
                                    <div className="space-y-2">
                                        <Label htmlFor="trigger_value">
                                            {formData.trigger_type === 'delay' ? 'Seconds' : 'Scroll Percentage (%)'}
                                        </Label>
                                        <Input 
                                            id="trigger_value" 
                                            type="number"
                                            value={formData.trigger_value} 
                                            onChange={(e) => handleChange('trigger_value', parseInt(e.target.value))} 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="devices">Target Devices</Label>
                                    <Select 
                                        value={formData.devices} 
                                        onValueChange={(val) => handleChange('devices', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select devices" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Devices</SelectItem>
                                            <SelectItem value="desktop">Desktop Only</SelectItem>
                                            <SelectItem value="mobile">Mobile Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pages">Target Pages (comma separated, use 'all' for all pages)</Label>
                                    <Input 
                                        id="pages" 
                                        value={formData.pages.join(', ')} 
                                        onChange={(e) => handleChange('pages', e.target.value.split(',').map(s => s.trim()))} 
                                        placeholder="e.g., all OR home, services, contact"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="content" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input 
                                    id="title" 
                                    value={formData.title} 
                                    onChange={(e) => handleChange('title', e.target.value)} 
                                    placeholder="Popup Heading"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea 
                                    id="description" 
                                    value={formData.description} 
                                    onChange={(e) => handleChange('description', e.target.value)} 
                                    placeholder="Popup content message"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="media_type">Media Type</Label>
                                    <Select 
                                        value={formData.media_type} 
                                        onValueChange={(val) => handleChange('media_type', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select media type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="video">Video (URL)</SelectItem>
                                            <SelectItem value="none">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {formData.media_type !== 'none' && (
                                    <div className="space-y-3">
                                        <Label>Media Content</Label>
                                        <div className="space-y-4">
                                            {/* Preview */}
                                            {formData.media_url && (
                                                <div className="relative rounded-lg border overflow-hidden bg-muted aspect-video">
                                                    {formData.media_type === 'image' ? (
                                                        <img 
                                                            src={formData.media_url} 
                                                            alt="Preview" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <video 
                                                            src={formData.media_url} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-7 w-7 rounded-full"
                                                        onClick={handleRemoveMedia}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <Input 
                                                        id="media_url" 
                                                        value={formData.media_url} 
                                                        onChange={(e) => handleChange('media_url', e.target.value)} 
                                                        placeholder={formData.media_type === 'image' ? "Image URL or Upload" : "Video URL or Upload"}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="file"
                                                        className="hidden"
                                                        id="media-upload"
                                                        accept={formData.media_type === 'image' ? "image/*" : "video/*"}
                                                        onChange={handleFileUpload}
                                                        disabled={isUploading}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => document.getElementById('media-upload')?.click()}
                                                        disabled={isUploading}
                                                        className="whitespace-nowrap rounded-xl"
                                                    >
                                                        {isUploading ? (
                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        ) : (
                                                            <Upload className="h-4 w-4 mr-2" />
                                                        )}
                                                        Upload
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="form" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cta_text">CTA Button Text</Label>
                                    <Input 
                                        id="cta_text" 
                                        value={formData.cta_text} 
                                        onChange={(e) => handleChange('cta_text', e.target.value)} 
                                        placeholder="e.g., Get Quote"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cta_link">CTA Button Link</Label>
                                    <Input 
                                        id="cta_link" 
                                        value={formData.cta_link} 
                                        onChange={(e) => handleChange('cta_link', e.target.value)} 
                                        placeholder="e.g., /contact or WhatsApp link"
                                    />
                                </div>
                            </div>

                            <div className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Lead Capture Form</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable a form to capture user details.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={formData.show_form} 
                                        onCheckedChange={(val) => handleChange('show_form', val)}
                                    />
                                </div>

                                {formData.show_form && (
                                    <div className="grid grid-cols-3 gap-4 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="field_name" 
                                                checked={formData.form_fields.name} 
                                                onCheckedChange={(val) => handleFormFieldChange('name', val as boolean)}
                                            />
                                            <Label htmlFor="field_name">Name Field</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="field_email" 
                                                checked={formData.form_fields.email} 
                                                onCheckedChange={(val) => handleFormFieldChange('email', val as boolean)}
                                            />
                                            <Label htmlFor="field_email">Email Field</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="field_phone" 
                                                checked={formData.form_fields.phone} 
                                                onCheckedChange={(val) => handleFormFieldChange('phone', val as boolean)}
                                            />
                                            <Label htmlFor="field_phone">Phone Field</Label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10 flex flex-row items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6">Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="rounded-xl px-6 bg-primary hover:bg-primary/90">
                            {isSaving ? 'Saving...' : (popup ? 'Update Popup' : 'Create Popup')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
