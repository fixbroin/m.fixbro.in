"use client";

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Upload, X, Loader2 } from 'lucide-react';
import { deleteFile } from '@/lib/storage-actions';

interface ImageUploadInputProps {
  id: string; 
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  accept?: string;
  folder?: string;
}

const MAX_IMAGE_SIZE_MB = 50;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE_MB = 1000;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
}

export default function ImageUploadInput({ 
    id, 
    value, 
    onChange, 
    className, 
    folder = 'general',
    accept = "image/*,video/*" // More permissive default
}: ImageUploadInputProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isPending = isUploading || isDeleting;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
        toast({
            variant: 'destructive',
            title: 'Image Too Large',
            description: `Images must be ${MAX_IMAGE_SIZE_MB}MB or less (files over 1MB are automatically compressed).`,
        });
        return;
    }

    if (!isImage && file.size > MAX_VIDEO_SIZE_BYTES) {
        toast({
            variant: 'destructive',
            title: 'Video Too Large',
            description: `Video must be less than ${MAX_VIDEO_SIZE_MB}MB.`,
        });
        return;
    }

    setIsUploading(true);
    setUploadProgress(2);
    setUploadStage('Uploading...');

    let compressTimer: ReturnType<typeof setInterval> | null = null;

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        if (value) formData.append('oldUrl', value);

        const result = await new Promise<{
            success: boolean;
            url?: string;
            compressed?: boolean;
            originalBytes?: number;
            finalBytes?: number;
            error?: string;
        }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/admin/upload');

            xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable && ev.total > 0) {
                    const pct = Math.min(88, Math.max(5, Math.round((ev.loaded / ev.total) * 88)));
                    setUploadProgress(pct);
                    if (pct >= 88) {
                        setUploadStage('Compressing & saving...');
                        if (!compressTimer) {
                            compressTimer = setInterval(() => {
                                setUploadProgress((prev) => (prev < 98 ? prev + 1 : prev));
                            }, 450);
                        }
                    } else {
                        setUploadStage(`Uploading (${pct}%)...`);
                    }
                }
            };

            xhr.upload.onload = () => {
                setUploadProgress((prev) => Math.max(prev, 90));
                setUploadStage('Compressing & saving...');
                if (!compressTimer) {
                    compressTimer = setInterval(() => {
                        setUploadProgress((prev) => (prev < 98 ? prev + 1 : prev));
                    }, 450);
                }
            };

            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText || '{}');
                    if (xhr.status >= 200 && xhr.status < 300 && data.success) {
                        resolve(data);
                    } else {
                        reject(new Error(data.error || `Upload failed (${xhr.status})`));
                    }
                } catch {
                    reject(new Error('Invalid server response during upload.'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error during upload.'));
            xhr.send(formData);
        });

        setUploadProgress(100);
        setUploadStage('Completed (100%)');

        if (result.success && result.url) {
            onChange(result.url);
            const fmtSize = (bytes?: number) => {
                if (!bytes) return '';
                if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
                return `${Math.round(bytes / 1024)} KB`;
            };
            const desc = result.compressed
                ? `Compressed ${fmtSize(result.originalBytes)} → ${fmtSize(result.finalBytes)}`
                : result.originalBytes
                    ? `Uploaded (${fmtSize(result.originalBytes)}, no compression needed)`
                    : 'File uploaded successfully!';
            toast({ title: 'Success', description: desc });
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error: any) {
        console.error("Upload error detail:", error);
        toast({ 
            variant: 'destructive', 
            title: 'Upload Failed',
            description: error.message || 'The server interrupted the upload. The file might be too large or the connection was lost.',
        });
    } finally {
        if (compressTimer) clearInterval(compressTimer);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStage('');
        // Reset the input value so the same file can be selected again if needed
        event.target.value = '';
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!value) return;
    
    if (getYouTubeVideoId(value)) {
        onChange('');
        return;
    }

    setIsDeleting(true);
    try {
        if (value.startsWith('/uploads/') || value.startsWith('/brands/')) {
            await deleteFile(value);
        }
        onChange('');
        toast({ description: 'Media removed.' });
    } catch (error: any) {
        toast({ description: `Error removing media.`, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
    }
  };
  
  const isDirectVideo = typeof value === 'string' && (value.includes('.mp4') || value.includes('.webm') || value.startsWith('data:video'));
  const youTubeVideoId = typeof value === 'string' ? getYouTubeVideoId(value) : null;
  
  const isValidImageUrl = (url: any): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('/') || url.startsWith('data:')) return true;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  let mediaPreview: React.ReactNode = null;
  if (value && typeof value === 'string') {
    if (youTubeVideoId) {
      mediaPreview = (
        <iframe
            src={`https://www.youtube.com/embed/${youTubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youTubeVideoId}&controls=0`}
            title="YouTube video preview"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full object-contain"
        ></iframe>
      );
    } else if (isDirectVideo) {
        mediaPreview = (
            <video src={value} className="w-full h-full object-contain" autoPlay loop muted playsInline />
        );
    } else if (isValidImageUrl(value)) { 
        mediaPreview = (
            <Image src={value} alt="Preview" fill className="object-contain" unoptimized />
        );
    } else {
        mediaPreview = (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center font-bold">
                Media URL set
            </div>
        );
    }
  }


  return (
    <div className={cn("space-y-4", className)}>
        {value && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed bg-muted/50 group">
                 {mediaPreview}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="h-10 w-10 rounded-full shadow-xl"
                        onClick={handleRemoveImage}
                        disabled={isPending}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                 </div>
            </div>
        )}
        {isUploading && (
            <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{uploadStage || 'Uploading...'}</span>
                    <span className="text-primary tabular-nums">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
            </div>
        )}
        <div className="flex items-center gap-4">
            <Input id={id} type="file" onChange={handleFileChange} disabled={isPending} className="hidden" accept={accept} />
            <label htmlFor={id} className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer w-full h-12 border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 font-bold transition-all', isPending && 'pointer-events-none opacity-50')}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? `${uploadStage || 'Uploading...'} ${uploadProgress}%` : 'Upload from Device'}
            </label>
        </div>
        
        <div className="space-y-2">
            <label htmlFor={`${id}-url`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Or Direct URL (External)</label>
            <Input
                id={`${id}-url`}
                type="text"
                placeholder="https://example.com/image.png"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={isPending}
                className="h-10 bg-muted/30 border-none focus-visible:ring-primary/20"
            />
        </div>
    </div>
  );
}
