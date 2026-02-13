import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { lexicalToMarkdown } from '@/lib/lexicalToMarkdown';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const _sort = searchParams.get('_sort') || 'createdAt';
    const _order = searchParams.get('_order') === 'ASC' ? 1 : -1;
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '10');
    const status = searchParams.get('status');
    const slug = searchParams.get('slug');

    // Get single post by ID
    if (id) {
      const post = await Post.findById(id).populate(['coverImage', 'author.picture']).lean();
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      // Convert Lexical JSON to markdown if needed
      const content = typeof post.content === 'string' ? post.content : lexicalToMarkdown(post.content);
      return NextResponse.json({ ...post, content, id: post._id.toString() });
    }

    // Get single post by slug
    if (slug) {
      const post = await Post.findOne({ slug }).populate(['coverImage', 'author.picture']).lean();
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      // Convert Lexical JSON to markdown if needed
      const content = typeof post.content === 'string' ? post.content : lexicalToMarkdown(post.content);
      return NextResponse.json({ ...post, content, id: post._id.toString() });
    }

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Get total count
    const total = await Post.countDocuments(query);

    // Get paginated posts
    const posts = await Post.find(query)
      .populate(['coverImage', 'author.picture'])
      .sort({ [_sort]: _order })
      .skip(_start)
      .limit(_end - _start)
      .lean();

    // Transform _id to id for React Admin and convert content to markdown
    const transformedPosts = posts.map(post => ({
      ...post,
      content: typeof post.content === 'string' ? post.content : lexicalToMarkdown(post.content),
      id: post._id.toString(),
    }));

    return NextResponse.json(transformedPosts, {
      headers: {
        'Content-Range': `posts ${_start}-${Math.min(_end, total)}/${total}`,
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
    const data = await request.json();
    const post = await Post.create(data);
    const postObj = post.toObject();
    
    // Transform _id to id for React Admin
    return NextResponse.json({ ...postObj, id: postObj._id.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const data = await request.json();
    const post = await Post.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const post = await Post.findByIdAndDelete(id);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
