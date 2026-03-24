
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { getMarketingSettings, updateMarketingSettings } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Chrome, Facebook as FbIcon, Code, Zap } from 'lucide-react';

const settingSchema = z.object({
  enabled: z.boolean(),
  value: z.string().optional(),
});

const formSchema = z.object({
  googleTagManagerId: settingSchema,
  googleAnalyticsId: settingSchema,
  googleAdsId: settingSchema,
  googleAdsLabel: settingSchema,
  googleRemarketing: settingSchema,
  googleOptimizeId: settingSchema,
  metaPixelId: settingSchema,
  metaPixelAccessToken: settingSchema,
  metaConversionsApiKey: settingSchema,
  bingUetTagId: settingSchema,
  pinterestTagId: settingSchema,
  microsoftClarityId: settingSchema,
  customHeadScript: settingSchema,
  customBodyScript: settingSchema,
});

type MarketingFormData = z.infer<typeof formSchema>;

export default function MarketingSetupForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<MarketingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      googleTagManagerId: { enabled: false, value: '' },
      googleAnalyticsId: { enabled: false, value: '' },
      googleAdsId: { enabled: false, value: '' },
      googleAdsLabel: { enabled: false, value: '' },
      googleRemarketing: { enabled: false, value: '' },
      googleOptimizeId: { enabled: false, value: '' },
      metaPixelId: { enabled: false, value: '' },
      metaPixelAccessToken: { enabled: false, value: '' },
      metaConversionsApiKey: { enabled: false, value: '' },
      bingUetTagId: { enabled: false, value: '' },
      pinterestTagId: { enabled: false, value: '' },
      microsoftClarityId: { enabled: false, value: '' },
      customHeadScript: { enabled: false, value: '' },
      customBodyScript: { enabled: false, value: '' },
    },
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      const data = await getMarketingSettings();
      if (data) {
        form.reset(data);
      }
      setIsLoading(false);
    }
    loadSettings();
  }, [form]);

  function onSubmit(values: MarketingFormData) {
    startTransition(async () => {
      try {
        await updateMarketingSettings(values);
        toast({
          title: 'Success!',
          description: 'Marketing settings have been updated.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update marketing settings.',
          variant: 'destructive',
        });
      }
    });
  }

  if (isLoading) {
    return (
        <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
                <Skeleton className="h-8 w-1/2 bg-slate-100 dark:bg-white/5" />
                <Skeleton className="h-4 w-3/4 bg-slate-100 dark:bg-white/5" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-24 w-full bg-slate-100 dark:bg-white/5" />
                <Skeleton className="h-24 w-full bg-slate-100 dark:bg-white/5" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card className="bg-card text-card-foreground border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                        <Chrome className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl text-foreground font-bold">Google Ecosystem</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingInput control={form.control} name="googleTagManagerId" label="Tag Manager ID" placeholder="GTM-XXXXXXX" />
                    <SettingInput control={form.control} name="googleAnalyticsId" label="Analytics 4 ID" placeholder="G-XXXXXXXXXX" />
                    <SettingInput control={form.control} name="googleAdsId" label="Ads Conversion ID" placeholder="AW-XXXXXXXXX" />
                    <SettingInput control={form.control} name="googleAdsLabel" label="Ads Label" placeholder="Optional label" />
                </div>
                <SettingTextarea control={form.control} name="googleRemarketing" label="Remarketing Tag" description="Paste the full remarketing snippet." />
            </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600">
                        <FbIcon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl text-foreground font-bold">Facebook / Meta</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                 <SettingInput control={form.control} name="metaPixelId" label="Pixel ID" placeholder="XXXXXXXXXXXXXXX" />
                 <SettingInput control={form.control} name="metaPixelAccessToken" label="CAPI Access Token" description="For Meta Conversions API." />
            </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                        <Zap className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl text-foreground font-bold">Other Platforms</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingInput control={form.control} name="bingUetTagId" label="Bing UET ID" placeholder="XXXXXXXXX" />
                    <SettingInput control={form.control} name="microsoftClarityId" label="Clarity ID" />
                </div>
            </CardContent>
        </Card>
        
        <Card className="bg-card text-card-foreground border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Code className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl text-foreground font-bold">Developer Scripts</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                 <SettingTextarea control={form.control} name="customHeadScript" label="Global <head> Injector" description="Paste pure JS code only." />
                 <SettingTextarea control={form.control} name="customBodyScript" label="Global <body> Injector" description="Paste pure JS code only." />
            </CardContent>
        </Card>
        

        <Button type="submit" disabled={isPending} className="w-full h-14 rounded-[2rem] font-black text-lg gap-2 shadow-xl shadow-primary/20">
          {isPending ? 'Syncing Ecosystem...' : 'Save Marketing Stack'}
          <Save className="h-5 w-5" />
        </Button>
      </form>
    </Form>
  );
}


// Helper components
type SettingInputProps = {
    control: any;
    name: string;
    label: string;
    placeholder?: string;
    description?: string;
}

function SettingInput({ control, name, label, placeholder, description }: SettingInputProps) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <div className="p-5 border border-border rounded-3xl space-y-4 bg-slate-50/30 dark:bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-bold">{label}</FormLabel>
                        <Switch
                            checked={field.value.enabled}
                            onCheckedChange={(checked) => field.onChange({ ...field.value, enabled: checked })}
                        />
                    </div>
                    {field.value.enabled && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <FormControl>
                                <Input placeholder={placeholder} value={field.value.value || ''} onChange={(e) => field.onChange({ ...field.value, value: e.target.value })} className="bg-background border-border" />
                            </FormControl>
                            {description && <FormDescription className="text-[10px] uppercase font-bold tracking-wider text-white">{description}</FormDescription>}
                            <FormMessage />
                        </div>
                    )}
                </div>
            )}
        />
    )
}

function SettingTextarea({ control, name, label, placeholder, description }: SettingInputProps) {
     return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <div className="p-5 border border-border rounded-3xl space-y-4 bg-slate-50/30 dark:bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-700 dark:text-gray-300 font-bold">{label}</FormLabel>
                        <Switch
                            checked={field.value.enabled}
                            onCheckedChange={(checked) => field.onChange({ ...field.value, enabled: checked })}
                        />
                    </div>
                    {field.value.enabled && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <FormControl>
                                <Textarea
                                    placeholder={placeholder}
                                    className="min-h-32 font-mono text-[11px] bg-background border-border"
                                    value={field.value.value || ''}
                                    onChange={(e) => field.onChange({ ...field.value, value: e.target.value })}
                                />
                            </FormControl>
                            {description && <FormDescription className="text-[10px] uppercase font-bold tracking-wider text-white">{description}</FormDescription>}
                            <FormMessage />
                        </div>
                    )}
                </div>
            )}
        />
    )
}
