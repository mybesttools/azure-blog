import { Post } from "@/interfaces/post";
import { getPayloadClient } from "@/payload/getPayloadClient";

export async function getPostSlugs(): Promise<string[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    limit: 1000,
  });
  return docs.map((post: any) => post.slug);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: slug,
      },
      status: {
        equals: 'published',
      },
    },
    limit: 1,
  });

  if (docs.length === 0) {
    return null;
  }

  const post: any = docs[0];
  
  // Convert rich text to HTML string
  const content = JSON.stringify(post.content);

  // Handle cover image
  let coverImage = '';
  if (post.coverImage && typeof post.coverImage === 'object') {
    coverImage = post.coverImage.url || '';
  }

  // Handle author picture
  let authorPicture = '';
  if (post.author?.picture && typeof post.author.picture === 'object') {
    authorPicture = post.author.picture.url || '';
  }

  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    coverImage,
    author: {
      name: post.author?.name || 'Unknown',
      picture: authorPicture,
    },
    excerpt: post.excerpt,
    ogImage: {
      url: coverImage,
    },
    content,
  };
}

export async function getAllPosts(): Promise<Post[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-date',
    limit: 1000,
  });

  const posts = docs.map((post: any) => {
    const content = JSON.stringify(post.content);
    
    let coverImage = '';
    if (post.coverImage && typeof post.coverImage === 'object') {
      coverImage = post.coverImage.url || '';
    }

    let authorPicture = '';
    if (post.author?.picture && typeof post.author.picture === 'object') {
      authorPicture = post.author.picture.url || '';
    }

    return {
      slug: post.slug,
      title: post.title,
      date: post.date,
      coverImage,
      author: {
        name: post.author?.name || 'Unknown',
        picture: authorPicture,
      },
      excerpt: post.excerpt,
      ogImage: {
        url: coverImage,
      },
      content,
    };
  });

  return posts;
}

