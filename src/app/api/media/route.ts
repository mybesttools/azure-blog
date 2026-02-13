import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Media from '@/models/Media';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
      return NextResponse.json({ ...media, id: media._id.toString() });
    }

    // Get total count
    const total = await Media.countDocuments();

    // Get paginated media
    const mediaFiles = await Media.find()
      .sort({ [_sort]: _order })
      .skip(_start)
      .limit(_end - _start)
      .lean();

    // Transform _id to id for React Admin
    const transformedMedia = mediaFiles.map(media => ({
      ...media,
      id: media._id.toString(),
    }));

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
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create media record
    const media = await Media.create({
      filename: file.name,
      mimeType: file.type,
      filesize: file.size,
      url: `/uploads/${filename}`,
      alt: formData.get('alt') || '',
    });

    const mediaObj = media.toObject();
    return NextResponse.json({ ...mediaObj, id: mediaObj._id.toString() }, { status: 201 });
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
