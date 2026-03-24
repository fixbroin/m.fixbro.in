
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Download, Upload, Loader2, Database, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportDatabase, importDatabase, clearTable } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function DatabaseToolsForm() {
  const { toast } = useToast();
  const [isExporting, startExportTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();
  const [isClearing, startCleanupTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = () => {
    startExportTransition(async () => {
      try {
        const data = await exportDatabase();
        if (data) {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cineelite-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({ title: 'Success', description: 'Database exported successfully.' });
        } else {
            throw new Error('Export returned no data.');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a JSON file to import.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        toast({ variant: 'destructive', title: 'Error reading file', description: 'Could not read the selected file.' });
        return;
      }
      
      startImportTransition(async () => {
        try {
          const result = await importDatabase(content);
          if (result.success) {
            toast({ title: 'Import Successful', description: 'Database has been restored from the backup file.' });
            setSelectedFile(null);
            const fileInput = document.getElementById('json-file') as HTMLInputElement;
            if(fileInput) fileInput.value = '';
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
          });
        }
      });
    };
    reader.readAsText(selectedFile);
  };

  const handleCleanup = (table: string, label: string) => {
    startCleanupTransition(async () => {
        try {
            const result = await clearTable(table);
            if (result.success) {
                toast({ title: 'Cleanup Successful', description: `${label} have been cleared.` });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Cleanup Failed',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
        }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export Data
            </CardTitle>
            <CardDescription>
                Download a complete JSON snapshot of your MySQL database. Recommended before any major changes.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Alert className="bg-primary/5 border-primary/20">
                <Database className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Safe Backup</AlertTitle>
                <AlertDescription>
                This will export all tables including settings, pages, services, and testimonials into a single portable file.
                </AlertDescription>
            </Alert>
            <Button onClick={handleExport} disabled={isExporting} className="mt-6 w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/20">
                {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                Download Full Backup
            </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Database Cleanup
            </CardTitle>
            <CardDescription>Clear specific tables to remove accumulated logs or test data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {[
                    { id: 'visitor_logs', label: 'Visitor Logs' },
                    { id: 'page_visits', label: 'Page Visits' },
                    { id: 'user_events', label: 'User Activity Events' },
                    { id: 'contact_submissions', label: 'Contact Submissions' },
                ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
                        <div>
                            <p className="font-bold">{item.label}</p>
                            <p className="text-xs text-muted-foreground">Permanent deletion of all {item.label.toLowerCase()}.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white border-destructive/20" disabled={isClearing}>
                                    Clear All
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all records from the <strong>{item.label}</strong> table. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCleanup(item.id, item.label)} className="bg-destructive hover:bg-destructive/90">
                                        Yes, Clear Table
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="border-destructive/20">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
                <Upload className="h-5 w-5" />
                Restore / Import
            </CardTitle>
            <CardDescription>Upload a JSON backup file to overwrite your current database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle className="font-black">DANGER: Full Overwrite</AlertTitle>
                <AlertDescription>
                Importing will <span className="underline font-bold text-destructive">DELETE all current data</span> and replace it with the contents of the file.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="json-file" className="font-bold">Select Backup File</Label>
                <Input id="json-file" type="file" accept="application/json" onChange={handleFileChange} className="bg-muted cursor-pointer h-12 pt-2.5" />
            </div>
            <Button onClick={handleImport} disabled={isImporting || !selectedFile} variant="destructive" className="w-full py-6 text-lg font-bold rounded-xl shadow-xl shadow-destructive/10">
                {isImporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
                Restore Database
            </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
