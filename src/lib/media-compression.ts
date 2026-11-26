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

export type VideoCompressionQuality = 'high' | 'balanced' | 'compact';

export interface CompressionOptions {
  videoQuality?: VideoCompressionQuality;
  imageTargetKb?: number;
}

export interface CompressedMediaResult {
  buffer: Buffer;
  extension: string;
  compressed: boolean;
  originalBytes: number;
  finalBytes: number;
}

const VIDEO_PRESETS: Record<
  VideoCompressionQuality,
  { maxWidth: number; crf: string; preset: string; audioBitrate: string }
> = {
  high: { maxWidth: 1920, crf: '22', preset: 'fast', audioBitrate: '128k' },
  balanced: { maxWidth: 1280, crf: '25', preset: 'veryfast', audioBitrate: '96k' },
  compact: { maxWidth: 1280, crf: '28', preset: 'veryfast', audioBitrate: '96k' },
};

/**
 * Compresses images > target size down to target (default < 1 MB) using sharp (WebP),
 * and compresses videos (.mp4/.webm/.mov) using ffmpeg H.264 +faststart when available.
 */
export async function compressMediaBuffer(
  buffer: Buffer,
  extension: string,
  options: CompressionOptions = {}
): Promise<CompressedMediaResult> {
  const ext = extension.toLowerCase();
  const originalBytes = buffer.length;
  const targetImageBytes =
    options.imageTargetKb && options.imageTargetKb > 0
      ? options.imageTargetKb * 1024
      : IMAGE_TARGET_BYTES;
  const videoQuality: VideoCompressionQuality = options.videoQuality || 'high';

  // 1. Image compression (only if > target size and compressible raster format)
  if (COMPRESSIBLE_IMAGE_EXTS.has(ext)) {
    if (originalBytes > MAX_IMAGE_UPLOAD_BYTES) {
      throw new Error('Image size must be 50MB or less.');
    }

    if (originalBytes <= targetImageBytes) {
      return {
        buffer,
        extension: ext,
        compressed: false,
        originalBytes,
        finalBytes: originalBytes,
      };
    }

    const compressedImage = await compressImageUnderTarget(buffer, targetImageBytes);
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
    const compressedVideo = await compressVideoWithFfmpeg(buffer, ext, videoQuality);
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

async function compressImageUnderTarget(input: Buffer, targetBytes: number): Promise<Buffer> {
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
      if (candidate.length <= targetBytes) {
        return candidate;
      }
    }
  }

  return bestBuffer;
}

async function compressVideoWithFfmpeg(
  input: Buffer,
  ext: string,
  videoQuality: VideoCompressionQuality
): Promise<Buffer | null> {
  const presetCfg = VIDEO_PRESETS[videoQuality] || VIDEO_PRESETS.high;
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
        `scale='min(${presetCfg.maxWidth},iw)':-2`,
        '-c:v',
        'libx264',
        '-preset',
        presetCfg.preset,
        '-crf',
        presetCfg.crf,
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        presetCfg.audioBitrate,
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
