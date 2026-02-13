import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable auth once NextAuth v5 session detection is fixed in API routes
    // const session = await getSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const _sort = searchParams.get('_sort') || 'createdAt';
    const _order = searchParams.get('_order') === 'ASC' ? 1 : -1;
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '10');

    // Get single user by ID
    if (id) {
      const user = await User.findById(id).select('-password').lean();
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ ...user, id: user._id.toString() });
    }

    // Get total count
    const total = await User.countDocuments();

    // Get paginated users
    const users = await User.find()
      .select('-password')
      .sort({ [_sort]: _order })
      .skip(_start)
      .limit(_end - _start)
      .lean();

    // Transform _id to id for React Admin
    const transformedUsers = users.map(user => ({
      ...user,
      id: user._id.toString(),
    }));

    return NextResponse.json(transformedUsers, {
      headers: {
        'Content-Range': `users ${_start}-${Math.min(_end, total)}/${total}`,
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
    
    // Hash password
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    const user = await User.create(data);
    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;
    return NextResponse.json({ ...userWithoutPassword, id: userObj._id.toString() }, { status: 201 });
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
    
    // Hash password if provided
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
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

    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
