'use server';

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');

export async function uploadFile(formData: FormData, folder: string = 'general'): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided.' };
    }

    // Ensure upload directory and page-specific subfolder exist
    const targetDir = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Use a more memory-efficient way for larger files (videos)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create numeric timestamp filename as requested (e.g., 1711234567890.ext)
    const timestamp = Date.now();
    // Normalize extension and handle edge cases
    let extension = path.extname(file.name).toLowerCase();
    if (!extension && file.type) {
        extension = `.${file.type.split('/')[1]}`;
    }
    if (!extension) extension = '.png';
    
    const fileName = `${timestamp}${extension}`;
    
    const filePath = path.join(targetDir, fileName);
    
    // Using synchronous write for now but with a buffer from arrayBuffer
    // Next.js Server Actions have a limit, but we increased it in next.config.ts
    fs.writeFileSync(filePath, buffer);

    // Return the public URL - Always use forward slashes for URLs
    const publicUrl = `/uploads/${folder}/${fileName}`;
    return { success: true, url: publicUrl };

  } catch (error: any) {
    console.error('Local upload error:', error);
    return { success: false, error: 'Failed to upload file locally. ' + (error.message || '') };
  }
}

export async function deleteFile(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!url || !url.startsWith('/uploads/')) {
      return { success: true }; // Not a local upload
    }

    const relativePath = url.replace(/^\//, ''); // remove leading slash
    const filePath = path.join(process.cwd(), 'public', relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Local delete error:', error);
    return { success: false, error: 'Failed to delete file locally.' };
  }
}
