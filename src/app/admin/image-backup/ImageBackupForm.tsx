
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Download, Upload, Loader2, Image as ImageIcon, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportImages, importImages } from './actions';

export default function ImageBackupForm() {
  const { toast } = useToast();
  const [isExporting, startExportTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = () => {
    startExportTransition(async () => {
      try {
        const result = await exportImages();
        if (result.success && result.data) {
          const binaryString = window.atob(result.data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/zip' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `images-backup-${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({ title: 'Success', description: 'Images exported successfully.' });
        } else {
            throw new Error(result.error || 'Export failed.');
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
      const file = e.target.files[0];
      if (!file.name.endsWith('.zip')) {
          toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a ZIP file.' });
          e.target.value = '';
          return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a ZIP file to import.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        toast({ variant: 'destructive', title: 'Error reading file', description: 'Could not read the selected file.' });
        return;
      }
      
      // Remove data:application/zip;base64, prefix
      const base64Data = content.split(',')[1];

      startImportTransition(async () => {
        try {
          const result = await importImages(base64Data);
          if (result.success) {
            toast({ title: 'Import Successful', description: 'Images have been restored from the backup file.' });
            setSelectedFile(null);
            const fileInput = document.getElementById('zip-file') as HTMLInputElement;
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
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export Images
            </CardTitle>
            <CardDescription>
                Download a complete ZIP archive of all uploaded images in public/uploads.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Alert className="bg-primary/5 border-primary/20">
                <Archive className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Image Archive</AlertTitle>
                <AlertDescription>
                This will zip all folders within the uploads directory (site, general, etc.) into a single file.
                </AlertDescription>
            </Alert>
            <Button onClick={handleExport} disabled={isExporting} className="mt-6 w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/20">
                {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                Download Images ZIP
            </Button>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="border-destructive/20">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
                <Upload className="h-5 w-5" />
                Restore Images
            </CardTitle>
            <CardDescription>Upload a ZIP backup file to restore images to the uploads folder.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle className="font-black">Restore Info</AlertTitle>
                <AlertDescription>
                Uploading a ZIP will merge or overwrite files in the public/uploads directory.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="zip-file" className="font-bold">Select ZIP Backup</Label>
                <Input id="zip-file" type="file" accept=".zip,application/zip" onChange={handleFileChange} className="bg-muted cursor-pointer h-12 pt-2.5" />
            </div>
            <Button onClick={handleImport} disabled={isImporting || !selectedFile} variant="destructive" className="w-full py-6 text-lg font-bold rounded-xl shadow-xl shadow-destructive/10">
                {isImporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
                Restore Images
            </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
