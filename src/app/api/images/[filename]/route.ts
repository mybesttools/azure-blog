import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Media from '@/models/Media';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    await connectDB();
    const { filename } = await params;
    
    // Extract the original filename from the timestamped name
    // Format: timestamp-originalname.ext
    const media = await Media.findOne({
      url: `/api/images/${filename}`
    }).lean();
    
    if (!media || !media.data) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    
    // Convert base64 back to binary
    const buffer = Buffer.from(media.data, 'base64');
    
    // Return the image with proper content type
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Media fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
