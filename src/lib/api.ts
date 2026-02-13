import { Post } from "@/interfaces/post";
import { connectDB } from "@/lib/mongodb";
import PostModel from "@/models/Post";
import { lexicalToHtml } from "@/lib/lexicalToHtml";
import markdownToHtml from "@/lib/markdownToHtml";

export async function getPostSlugs(): Promise<string[]> {
  await connectDB();
  const posts = await PostModel.find({ status: 'published' }, 'slug').lean();
  return posts.map((post: any) => post.slug);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  await connectDB();
  const post = await PostModel.findOne({ slug, status: 'published' })
    .populate('coverImage')
    .populate('author.picture')
    .lean();

  if (!post) {
    return null;
  }

  // Convert content to HTML - handle both markdown strings and Lexical JSON
  let content: string;
  if (typeof post.content === 'string') {
    // It's markdown, convert to HTML
    content = await markdownToHtml(post.content);
  } else {
    // It's Lexical JSON, convert to HTML
    content = lexicalToHtml(post.content);
  }

  // Handle cover image
  let coverImage = '';
  if (post.coverImage) {
    if (typeof post.coverImage === 'object' && 'url' in post.coverImage) {
      coverImage = (post.coverImage as any).url || '';
    } else if (typeof post.coverImage === 'string') {
      // If it's already a string path, use it directly
      coverImage = post.coverImage;
    }
  }

  // Handle author picture
  let authorPicture = '';
  if (post.author?.picture) {
    if (typeof post.author.picture === 'object' && 'url' in post.author.picture) {
      authorPicture = (post.author.picture as any).url || '';
    } else if (typeof post.author.picture === 'string') {
      // If it's already a string path, use it directly
      authorPicture = post.author.picture;
    }
  }

  return {
    slug: post.slug,
    title: post.title,
    date: post.date.toISOString(),
    coverImage: coverImage || '/assets/blog/preview/cover.jpg',
    author: {
      name: post.author?.name || 'Unknown',
      picture: authorPicture || '/assets/blog/authors/jj.jpeg',
    },
    excerpt: post.excerpt,
    ogImage: {
      url: coverImage || '/assets/blog/preview/cover.jpg',
    },
    content,
  };
}

export async function getAllPosts(): Promise<Post[]> {
  await connectDB();
  const posts = await PostModel.find({ status: 'published' })
    .populate('coverImage')
    .populate('author.picture')
    .sort({ date: -1 })
    .lean();

  return Promise.all(posts.map(async (post: any) => {
    // Convert content to HTML - handle both markdown strings and Lexical JSON
    let content: string;
    if (typeof post.content === 'string') {
      // It's markdown, convert to HTML
      content = await markdownToHtml(post.content);
    } else {
      // It's Lexical JSON, convert to HTML
      content = lexicalToHtml(post.content);
    }

    let coverImage = '';
    if (post.coverImage) {
      if (typeof post.coverImage === 'object' && 'url' in post.coverImage) {
        coverImage = post.coverImage.url || '';
      } else if (typeof post.coverImage === 'string') {
        coverImage = post.coverImage;
      }
    }

    let authorPicture = '';
    if (post.author?.picture) {
      if (typeof post.author.picture === 'object' && 'url' in post.author.picture) {
        authorPicture = post.author.picture.url || '';
      } else if (typeof post.author.picture === 'string') {
        authorPicture = post.author.picture;
      }
    }

    return {
      slug: post.slug,
      title: post.title,
      date: post.date.toISOString(),
      coverImage: coverImage || '/assets/blog/preview/cover.jpg',
      author: {
        name: post.author?.name || 'Unknown',
        picture: authorPicture || '/assets/blog/authors/jj.jpeg',
      },
      excerpt: post.excerpt,
      ogImage: {
        url: coverImage || '/assets/blog/preview/cover.jpg',
      },
      content,
    };
  }));
}

