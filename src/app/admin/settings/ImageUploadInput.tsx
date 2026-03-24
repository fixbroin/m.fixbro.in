"use client";

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Upload, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { uploadFile, deleteFile } from '@/lib/storage-actions';

interface ImageUploadInputProps {
  id: string; 
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  accept?: string;
  folder?: string; // New folder prop for organizing uploads
}

const MAX_FILE_SIZE_MB = 50; // Increased to 50MB for videos
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  // Support for: watch?v=, v/, u/w/1/..., embed/, youtu.be/, shorts/
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
    accept = "image/png, image/jpeg, image/webp, image/svg+xml, image/ico, .ico" 
}: ImageUploadInputProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPending = isUploading || isDeleting;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
            variant: 'destructive',
            title: 'File Too Large',
            description: `The selected file must be less than ${MAX_FILE_SIZE_MB}MB.`,
        });
        return;
    }

    const acceptedTypes = accept.split(',').map(t => t.trim());
    const isFileTypeAcceptable = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      // Check both MIME type and extension
      const lowerFile = file.name.toLowerCase();
      const lowerType = type.toLowerCase();
      return file.type === type || lowerFile.endsWith(lowerType) || (type.startsWith('.') && lowerFile.endsWith(lowerType));
    });

    if (!isFileTypeAcceptable) {
         toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: `Please select a valid file type.`,
        });
        return;
    }

    setIsUploading(true);

    try {
        // Delete old file if it was a local upload
        if (value && value.startsWith('/uploads/')) {
            await deleteFile(value);
        }

        const formData = new FormData();
        formData.append('file', file);
        
        const result = await uploadFile(formData, folder);

        if (result.success && result.url) {
            onChange(result.url);
            toast({ description: 'File uploaded locally successfully!' });
        } else {
            throw new Error(result.error || 'Upload failed');
        }

    } catch (error: any) {
        console.error("Upload error:", error);
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message || 'Could not upload the file.',
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!value) return;
    
    // If it's a youtube link, just clear the value
    if (getYouTubeVideoId(value)) {
        onChange('');
        return;
    }

    setIsDeleting(true);
    try {
        if (value.startsWith('/uploads/')) {
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
            <Image src={value} alt="Preview" fill className="object-contain" />
        );
    } else {
        mediaPreview = (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center font-bold">
                Invalid or Remote Image URL
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
        <div className="flex items-center gap-4">
            <Input id={id} type="file" onChange={handleFileChange} disabled={isPending} className="hidden" accept={accept} />
            <label htmlFor={id} className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer w-full h-12 border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 font-bold transition-all', isPending && 'pointer-events-none opacity-50')}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? `Processing...` : 'Upload from Device'}
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

function Loader2(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
