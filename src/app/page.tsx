import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { HeroPost } from "@/app/_components/hero-post";
import { Intro } from "@/app/_components/intro";
import { MoreStories } from "@/app/_components/more-stories";
import { getAllPosts } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import PostModel from "@/models/Post";
import type { Post } from "@/interfaces/post";

export const dynamic = 'force-dynamic';

async function getDefaultCategoryPosts(): Promise<Post[]> {
  try {
    await connectDB();
    
    // Get the default category
    const defaultCategory = await Category.findOne({ isDefault: true }).lean();
    
    if (!defaultCategory) {
      // If no default category, return all posts
      return await getAllPosts();
    }

    // Get posts from the default category
    const posts = await PostModel.find({
      status: 'published',
      category: defaultCategory._id,
    })
      .populate('coverImage')
      .populate('author.picture')
      .sort({ date: -1 })
      .lean();

    return posts.map((post: any) => {
      let coverImage = '';
      if (post.coverImage) {
        coverImage = typeof post.coverImage === 'object' && post.coverImage !== null 
          ? (post.coverImage as any).url 
          : (post.coverImage as string) || '';
      }

      let authorPicture = '';
      if (post.author?.picture) {
        authorPicture = typeof post.author.picture === 'object' && post.author.picture !== null
          ? (post.author.picture as any).url
          : (post.author.picture as string) || '';
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
        content: '',
      };
    });
  } catch (error) {
    console.error('Error fetching default category posts:', error);
    return [];
  }
}

export default async function Index() {
  let allPosts: Post[] = [];
  let dbUnavailable = false;

  try {
    allPosts = await getDefaultCategoryPosts();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dbUnavailable = message.includes('ECONNREFUSED') || message.includes('Server selection timed out');
  }

  const heroPost = allPosts[0];

  const morePosts = allPosts.slice(1);

  return (
    <main>
      <Container>
        <Header />
        <Intro />
        {dbUnavailable && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Database is unavailable. Please start MongoDB or set a valid MONGODB_URI.
          </div>
        )}
        {heroPost && (
          <HeroPost
            title={heroPost.title}
            coverImage={heroPost.coverImage}
            date={heroPost.date}
            author={heroPost.author}
            slug={heroPost.slug}
            excerpt={heroPost.excerpt}
          />
        )}
        {morePosts.length > 0 && <MoreStories posts={morePosts} />}
      </Container>
    </main>
  );
}
