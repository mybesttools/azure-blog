import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { HeroPost } from "@/app/_components/hero-post";
import { Intro } from "@/app/_components/intro";
import { MoreStories } from "@/app/_components/more-stories";
import { getAllPosts } from "@/lib/api";

export const dynamic = 'force-dynamic';

export default async function Index() {
  let allPosts = [];
  let dbUnavailable = false;

  try {
    allPosts = await getAllPosts();
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
