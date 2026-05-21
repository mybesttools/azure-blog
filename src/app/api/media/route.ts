import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Media from '@/models/Media';
import { getSession } from '@/lib/auth';

// Allow up to 60 seconds for upload processing
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const _sort = searchParams.get('_sort') || 'createdAt';
    const _order = searchParams.get('_order') === 'ASC' ? 1 : -1;
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '10');

    // Get single media by ID
    if (id) {
      const media = await Media.findById(id).lean();
      if (!media) {
        return NextResponse.json({ error: 'Media not found' }, { status: 404 });
      }
      // Don't send base64 data in JSON responses
      const { data, ...mediaWithoutData } = media;
      return NextResponse.json({ ...mediaWithoutData, id: media._id.toString() });
    }

    // Get total count
    const total = await Media.countDocuments();

    // Get paginated media
    const mediaFiles = await Media.find()
      .sort({ [_sort]: _order })
      .skip(_start)
      .limit(_end - _start)
      .lean();

    // Transform _id to id for React Admin and remove base64 data
    const transformedMedia = mediaFiles.map(media => {
      const { data, ...mediaWithoutData } = media;
      return {
        ...mediaWithoutData,
        id: media._id.toString(),
      };
    });

    return NextResponse.json(transformedMedia, {
      headers: {
        'Content-Range': `media ${_start}-${Math.min(_end, total)}/${total}`,
        'Access-Control-Expose-Headers': 'Content-Range',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const formData = await request.formData();
    const fileEntry = formData.get('file');
    
    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const file = fileEntry;

    // Check file size (limit to 10MB for MongoDB storage)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Convert file to base64 for MongoDB storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Generate unique filename for the URL
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    // Create media record with embedded file data
    const media = await Media.create({
      filename: file.name,
      mimeType: file.type,
      filesize: file.size,
      url: `/api/images/${filename}`, // URL will serve from database
      alt: formData.get('alt') || '',
      data: base64Data, // Store the actual file in MongoDB
    });

    const mediaObj = media.toObject();
    // Don't send the base64 data back in the response (too large)
    const { data, ...responseObj } = mediaObj;
    return NextResponse.json({ ...responseObj, id: mediaObj._id.toString() }, { status: 201 });
  } catch (error: any) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const media = await Media.findByIdAndDelete(id);
    
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Optionally delete physical file here

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
