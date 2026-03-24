
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useTransition } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getGeneralSettings, updateGeneralSettings } from './actions/general-actions';
import ImageUploadInput from './ImageUploadInput';
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Globe, Share2, Sparkles, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

const loaderTypes = [
  "pulse", "typing", "bars", "gradient", "orbit", "dots", "progress", 
  "cube", "shine", "bounce", "ring", "flip", "wave", "heart", "matrix"
];

const formSchema = z.object({
  website_name: z.string().min(1, 'Website name is required'),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  footer_description: z.string().min(1, 'Footer description is required'),
  facebook_url: z.string().url().optional().or(z.literal('')),
  instagram_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  youtube_url: z.string().url().optional().or(z.literal('')),
  loaderType: z.string(),
});

export default function GeneralSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      website_name: '',
      logo: '',
      favicon: '',
      footer_description: '',
      facebook_url: '',
      instagram_url: '',
      twitter_url: '',
      linkedin_url: '',
      youtube_url: '',
      loaderType: 'pulse',
    },
  });

  useEffect(() => {
    startTransition(async () => {
      const data = await getGeneralSettings();
      if (data) {
        form.reset({
          website_name: data.website_name || '',
          logo: data.logo || '',
          favicon: data.favicon || '',
          footer_description: data.footer_description || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          twitter_url: data.twitter_url || '',
          linkedin_url: data.linkedin_url || '',
          youtube_url: data.youtube_url || '',
          loaderType: data.loaderType || 'pulse',
        });
      }
    });
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        try {
            await updateGeneralSettings(values);
            toast({
              title: 'Success!',
              description: 'General settings updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Update Failed',
                description: 'Could not sync settings with the cloud.',
                variant: 'destructive',
            })
        }
    });
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
    >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 text-foreground">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Branding */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-card text-card-foreground border-border shadow-sm dark:shadow-2xl overflow-hidden">
                        <CardHeader className="pb-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-foreground font-bold">Identity & Branding</CardTitle>
                                    <CardDescription className="text-muted-foreground">How your brand appears to the public.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField
                                control={form.control}
                                name="website_name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-slate-700 dark:text-gray-300 font-semibold">Website Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="CineElite ADS" {...field} className="bg-slate-50 dark:bg-white/5 border-border text-foreground h-11 focus-visible:ring-primary/20 transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="logo"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel className="text-slate-700 dark:text-gray-300 font-semibold">Brand Logo</FormLabel>
                                        <FormControl>
                                        <ImageUploadInput id="logo-upload" value={field.value} onChange={field.onChange} folder="site" />
                                        </FormControl>
                                        <FormDescription className="text-white dark:text-gray-500 text-[11px]">Recommended: Transparent PNG, max 40px height.</FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="favicon"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel className="text-slate-700 dark:text-gray-300 font-semibold">Browser Icon (Favicon)</FormLabel>
                                        <FormControl>
                                        <ImageUploadInput id="favicon-upload" value={field.value} onChange={field.onChange} folder="site" />
                                        </FormControl>
                                        <FormDescription className="text-white dark:text-gray-500 text-[11px]">Best: 32x32px .png or .ico file.</FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="footer_description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-slate-700 dark:text-gray-300 font-semibold">Footer Tagline</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Crafting modern digital experiences..." {...field} className="bg-slate-50 dark:bg-white/5 border-border text-foreground min-h-[100px] focus-visible:ring-primary/20 transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-card text-card-foreground border-border shadow-sm dark:shadow-2xl overflow-hidden">
                        <CardHeader className="pb-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-foreground font-bold">Experience Settings</CardTitle>
                                    <CardDescription className="text-muted-foreground">Global UI interactions and loading states.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormField
                                control={form.control}
                                name="loaderType"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-slate-700 dark:text-gray-300 font-semibold">Page Transition Style</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger className="bg-slate-50 dark:bg-white/5 border-border text-foreground h-11 focus:ring-primary/20 transition-all">
                                            <SelectValue placeholder="Select style" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-popover border-border text-popover-foreground shadow-xl font-medium">
                                        {loaderTypes.map((type) => (
                                            <SelectItem key={type} value={type} className="focus:bg-primary/5 dark:focus:bg-primary/10 focus:text-primary dark:focus:text-white">
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Socials & Save */}
                <div className="space-y-8">
                    <Card className="bg-card text-card-foreground border-border shadow-sm dark:shadow-2xl overflow-hidden">
                        <CardHeader className="pb-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Share2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-foreground font-bold">Social Presence</CardTitle>
                                    <CardDescription className="text-muted-foreground">Connect your profiles.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <FormField
                                control={form.control}
                                name="facebook_url"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-[10px] text-white dark:text-gray-500 flex items-center gap-2 font-bold uppercase tracking-wider"><Facebook size={12} className="text-[#1877F2]"/> Facebook</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-50 dark:bg-white/5 border-border text-foreground h-10 text-sm focus-visible:ring-primary/20 transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="instagram_url"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-[10px] text-white dark:text-gray-500 flex items-center gap-2 font-bold uppercase tracking-wider"><Instagram size={12} className="text-[#E4405F]"/> Instagram</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-50 dark:bg-white/5 border-border text-foreground h-10 text-sm focus-visible:ring-primary/20 transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="twitter_url"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-[10px] text-white dark:text-gray-500 flex items-center gap-2 font-bold uppercase tracking-wider"><Twitter size={12} className="text-[#1DA1F2]"/> Twitter (X)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-50 dark:bg-white/5 border-border text-foreground h-10 text-sm focus-visible:ring-primary/20 transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="linkedin_url"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-[10px] text-white dark:text-gray-500 flex items-center gap-2 font-bold uppercase tracking-wider"><Linkedin size={12} className="text-[#0A66C2]"/> LinkedIn</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-50 dark:bg-white/5 border-border text-foreground h-10 text-sm focus-visible:ring-primary/20 transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="youtube_url"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-[10px] text-white dark:text-gray-500 flex items-center gap-2 font-bold uppercase tracking-wider"><Youtube size={12} className="text-[#FF0000]"/> YouTube</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-50 dark:bg-white/5 border-border text-foreground h-10 text-sm focus-visible:ring-primary/20 transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Button 
                        type="submit" 
                        disabled={isPending}
                        className="w-full h-12 text-lg shadow-xl shadow-primary/20 flex items-center gap-2 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        {isPending ? 'Syncing...' : 'Save Configuration'}
                    </Button>
                </div>
            </div>
          </form>
        </Form>
    </motion.div>
  );
}
