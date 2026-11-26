import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

export const MAX_IMAGE_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
export const IMAGE_TARGET_BYTES = 980 * 1024; // < 1 MB target

const COMPRESSIBLE_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov']);

export interface CompressedMediaResult {
  buffer: Buffer;
  extension: string;
  compressed: boolean;
  originalBytes: number;
  finalBytes: number;
}

/**
 * Compresses images > 1 MB down to < 1 MB using sharp (WebP) while preserving quality,
 * and compresses videos (.mp4/.webm/.mov) using ffmpeg H.264 +faststart when available.
 */
export async function compressMediaBuffer(
  buffer: Buffer,
  extension: string
): Promise<CompressedMediaResult> {
  const ext = extension.toLowerCase();
  const originalBytes = buffer.length;

  // 1. Image compression (only if > 1 MB and compressible raster format)
  if (COMPRESSIBLE_IMAGE_EXTS.has(ext)) {
    if (originalBytes > MAX_IMAGE_UPLOAD_BYTES) {
      throw new Error('Image size must be 50MB or less.');
    }

    if (originalBytes <= 1024 * 1024) {
      return {
        buffer,
        extension: ext,
        compressed: false,
        originalBytes,
        finalBytes: originalBytes,
      };
    }

    const compressedImage = await compressImageUnderOneMb(buffer);
    if (compressedImage.length < originalBytes) {
      return {
        buffer: compressedImage,
        extension: '.webp',
        compressed: true,
        originalBytes,
        finalBytes: compressedImage.length,
      };
    }

    return {
      buffer,
      extension: ext,
      compressed: false,
      originalBytes,
      finalBytes: originalBytes,
    };
  }

  // 2. Video compression (H.264 MP4 +faststart for web streaming)
  if (VIDEO_EXTS.has(ext)) {
    const compressedVideo = await compressVideoWithFfmpeg(buffer, ext);
    if (compressedVideo && compressedVideo.length < originalBytes) {
      return {
        buffer: compressedVideo,
        extension: '.mp4',
        compressed: true,
        originalBytes,
        finalBytes: compressedVideo.length,
      };
    }
  }

  return {
    buffer,
    extension: ext,
    compressed: false,
    originalBytes,
    finalBytes: originalBytes,
  };
}

async function compressImageUnderOneMb(input: Buffer): Promise<Buffer> {
  const maxDimensions = [1920, 1600, 1280, 1024];
  const qualities = [84, 76, 68, 58, 48];

  let bestBuffer: Buffer = input;

  for (const maxDim of maxDimensions) {
    for (const quality of qualities) {
      const candidate = await sharp(input)
        .rotate()
        .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();

      bestBuffer = candidate;
      if (candidate.length <= IMAGE_TARGET_BYTES) {
        return candidate;
      }
    }
  }

  return bestBuffer;
}

async function compressVideoWithFfmpeg(input: Buffer, ext: string): Promise<Buffer | null> {
  const tmpId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpIn = path.join(os.tmpdir(), `fixbro-in-${tmpId}${ext}`);
  const tmpOut = path.join(os.tmpdir(), `fixbro-out-${tmpId}.mp4`);

  try {
    await fs.promises.writeFile(tmpIn, input);

    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i',
        tmpIn,
        '-vf',
        "scale='min(1280,iw)':-2",
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '26',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        tmpOut,
      ],
      { timeout: 180_000, maxBuffer: 10 * 1024 * 1024 }
    );

    if (fs.existsSync(tmpOut)) {
      const outBuf = await fs.promises.readFile(tmpOut);
      console.log(
        `[MediaCompression] Video compressed: ${(input.length / (1024 * 1024)).toFixed(2)} MB -> ${(outBuf.length / (1024 * 1024)).toFixed(2)} MB`
      );
      return outBuf;
    }
    return null;
  } catch (err) {
    console.warn('ffmpeg video compression skipped/failed, using original video:', err);
    return null;
  } finally {
    await Promise.allSettled([
      fs.promises.unlink(tmpIn),
      fs.promises.unlink(tmpOut),
    ]);
  }
}
