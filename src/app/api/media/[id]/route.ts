import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Media from '@/models/Media';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const media = await Media.findById(id).lean();
    
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    
    // Don't send base64 data in JSON responses (too large)
    const { data, ...mediaWithoutData } = media;
    return NextResponse.json({ ...mediaWithoutData, id: media._id.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id: paramId } = await params;
    
    const body = await request.json();
    const { id, _id, ...updateData } = body;
    
    const media = await Media.findByIdAndUpdate(
      paramId,
      updateData,
      { new: true, runValidators: true }
    ).lean();
    
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    
    return NextResponse.json({ ...media, id: media._id.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    
    const media = await Media.findById(id).lean();
    
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    
    // Delete from database (no physical file to delete)
    await Media.findByIdAndDelete(id);
    
    const { data, ...mediaWithoutData } = media;
    return NextResponse.json({ ...mediaWithoutData, id: media._id.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
