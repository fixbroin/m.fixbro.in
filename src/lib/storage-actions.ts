'use server';

import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const ALLOWED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.avif', '.mp4', '.webm', '.mov'
]);

export async function uploadFile(formData: FormData, folder: string = 'general'): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await requireAdmin();

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided.' };
    }

    // Sanitize folder name to prevent path traversal
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const targetDir = path.resolve(UPLOAD_DIR, safeFolder);
    if (!targetDir.startsWith(UPLOAD_DIR + path.sep)) {
      return { success: false, error: 'Invalid upload folder.' };
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const timestamp = Date.now();
    let extension = path.extname(file.name).toLowerCase();
    if (!extension && file.type) {
      extension = `.${file.type.split('/')[1]?.toLowerCase() || ''}`;
    }
    if (!extension) extension = '.png';

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return { success: false, error: `Unsupported file type: ${extension}` };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${timestamp}${extension}`;
    const filePath = path.resolve(targetDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeFolder}/${fileName}`;
    return { success: true, url: publicUrl };

  } catch (error: any) {
    console.error('Local upload error:', error);
    return { success: false, error: 'Failed to upload file locally. ' + (error.message || '') };
  }
}

export async function deleteFile(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!url || !url.startsWith('/uploads/')) {
      return { success: true }; // Not a local upload
    }

    const relativePath = url.replace(/^\/+/, '');
    const filePath = path.resolve(process.cwd(), 'public', relativePath);

    // Prevent path traversal outside public/uploads
    if (!filePath.startsWith(UPLOAD_DIR + path.sep)) {
      return { success: false, error: 'Invalid file path.' };
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Local delete error:', error);
    return { success: false, error: 'Failed to delete file locally.' };
  }
}
