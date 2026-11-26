import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { uploadFile } from '@/lib/storage-actions';

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const folder = String(formData.get('folder') || 'general');
    const oldUrlValue = formData.get('oldUrl');
    const oldUrl = typeof oldUrlValue === 'string' && oldUrlValue.trim() ? oldUrlValue : undefined;

    const result = await uploadFile(formData, folder, oldUrl);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Upload failed.' },
      { status: 500 }
    );
  }
}
