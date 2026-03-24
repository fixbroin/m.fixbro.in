
"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Wand2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getVantaSettings, updateVantaSettings } from './actions/vanta-actions';
import { Separator } from '@/components/ui/separator';
import type { VantaSettings } from '@/types/firestore';

const vantaEffects = ["WAVES", "BIRDS", "CELLS", "GLOBE", "FOG", "CLOUDS", "NET", "RINGS", "DOTS", "TRUNK"];

const sectionConfigs = [
  { id: 'hero', label: 'Hero Section' },
  { id: 'services', label: 'Services Section' },
  { id: 'whyChooseUs', label: 'Why Choose Us Section' },
  { id: 'portfolio', label: 'Portfolio Section' },
  { id: 'pricing', label: 'Pricing Section' },
  { id: 'testimonials', label: 'Testimonials Section' },
  { id: 'faq', label: 'FAQ Section' },
  { id: 'contact', label: 'Contact Section' },
  { id: 'footer', label: 'Footer Section' },
];

export default function VantaSettings() {
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<VantaSettings>({ globalEnable: true, sections: {} });

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    const data = await getVantaSettings();
    const sanitizedSections = { ...data.sections };
    sectionConfigs.forEach(config => {
      if (!sanitizedSections[config.id]) {
        sanitizedSections[config.id] = { enabled: false, effect: 'WAVES', color1: '#ffffff', color2: '#000000' };
      }
    });
    setSettings({ ...data, sections: sanitizedSections });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSectionChange = (sectionId: string, field: string, value: any) => {
    setSettings((prev: VantaSettings) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          [field]: value
        }
      }
    }));
  };

  const handleSave = () => {
    startSavingTransition(async () => {
      try {
        await updateVantaSettings(settings);
        toast({ title: "Success", description: "Vanta settings saved successfully." });
      } catch (error) {
        toast({ title: "Error", description: "Could not save Vanta settings.", variant: "destructive" });
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Loading Vanta settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Wand2 className="mr-2 h-6 w-6 text-primary" /> Animated Background Settings
          </CardTitle>
          <CardDescription>
            Manage the Vanta.js animated backgrounds for different sections of your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center space-x-2 rounded-lg border p-4">
              <Switch 
                id="global-enable" 
                checked={settings.globalEnable}
                onCheckedChange={(checked) => setSettings((prev: VantaSettings) => ({ ...prev, globalEnable: checked }))}
              />
              <Label htmlFor="global-enable" className="text-lg">
                Enable Animated Backgrounds Globally
              </Label>
            </div>
        </CardContent>
      </Card>
      
      {settings.globalEnable && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sectionConfigs.map(section => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.label}</CardTitle>
                <div className="flex items-center pt-4">
                   <Switch
                      id={`enable-${section.id}`}
                      checked={settings.sections[section.id]?.enabled ?? false}
                      onCheckedChange={(checked) => handleSectionChange(section.id, 'enabled', checked)}
                    />
                  <Label htmlFor={`enable-${section.id}`} className="ml-2">Enable for this section</Label>
                </div>
              </CardHeader>
              {settings.sections[section.id]?.enabled && (
                <CardContent className="space-y-4">
                  <Separator />
                  <div className='space-y-2'>
                    <Label>Animation Effect</Label>
                    <Select
                      value={settings.sections[section.id]?.effect || 'WAVES'}
                      onValueChange={(value) => handleSectionChange(section.id, 'effect', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an effect" />
                      </SelectTrigger>
                      <SelectContent>
                        {vantaEffects.map(effect => (
                          <SelectItem key={effect} value={effect}>{effect}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Animation Color 1</Label>
                    <Input
                      type="color"
                      value={settings.sections[section.id]?.color1 || '#ffffff'}
                      onChange={(e) => handleSectionChange(section.id, 'color1', e.target.value)}
                    />
                  </div>
                   <div className='space-y-2'>
                    <Label>Animation Color 2</Label>
                    <Input
                      type="color"
                      value={settings.sections[section.id]?.color2 || '#000000'}
                      onChange={(e) => handleSectionChange(section.id, 'color2', e.target.value)}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <CardFooter className="border-t pt-6 mt-6">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className='ml-auto'>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </CardFooter>
    </div>
  );
}
