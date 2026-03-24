'use server';

import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { revalidatePath } from 'next/cache';
import { getSession } from '../login/auth-actions';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');

export async function exportImages(): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      return { success: false, error: 'Upload directory does not exist.' };
    }

    const zip = new AdmZip();
    zip.addLocalFolder(UPLOAD_DIR);
    
    const buffer = zip.toBuffer();
    const base64 = buffer.toString('base64');

    return { success: true, data: base64 };
  } catch (error: any) {
    console.error('Error exporting images:', error);
    return { success: false, error: `Failed to export images: ${error.message}` };
  }
}

export async function importImages(base64Data: string): Promise<{ success: boolean; error?: string }> {
  const tempDir = `${UPLOAD_DIR}_backup_${Date.now()}`;
  let backupCreated = false;

  try {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const zip = new AdmZip(buffer);

    // 1. Create a backup of the current uploads folder by renaming it
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.renameSync(UPLOAD_DIR, tempDir);
      backupCreated = true;
    }

    // 2. Create a fresh uploads directory
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    try {
      // 3. Extract the new ZIP content
      zip.extractAllTo(UPLOAD_DIR, true);
      
      // 4. Success: Remove the temporary backup folder
      if (backupCreated) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (extractError) {
      // 5. Extraction failed: Rollback to the backup
      if (backupCreated) {
        if (fs.existsSync(UPLOAD_DIR)) {
          fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
        }
        fs.renameSync(tempDir, UPLOAD_DIR);
      }
      throw extractError;
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Error importing images:', error);
    return { success: false, error: `Failed to import images: ${error.message}` };
  }
}
