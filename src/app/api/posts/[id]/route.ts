import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { lexicalToMarkdown } from '@/lib/lexicalToMarkdown';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const post = await Post.findById(id)
      .populate(['coverImage', 'author.picture'])
      .lean();
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Convert Lexical JSON to markdown if needed
    const content = typeof post.content === 'string' ? post.content : lexicalToMarkdown(post.content);
    return NextResponse.json({ ...post, content, id: post._id.toString() });
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
    const { id, _id, ...updateData } = body; // Remove id fields from update
    
    const post = await Post.findByIdAndUpdate(
      paramId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate(['coverImage', 'author.picture'])
      .lean();
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Convert Lexical JSON to markdown if needed
    const content = typeof post.content === 'string' ? post.content : lexicalToMarkdown(post.content);
    return NextResponse.json({ ...post, content, id: post._id.toString() });
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
    
    const post = await Post.findByIdAndDelete(id).lean();
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    return NextResponse.json({ ...post, id: post._id.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
