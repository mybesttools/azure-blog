import { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { MoreStories } from "@/app/_components/more-stories";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import PostModel from "@/models/Post";

type Params = Promise<{
  slug: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const category = await Category.findOne({ slug: slug }).lean();

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} | Blog`,
    description: category.description || `Posts about ${category.name}`,
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  await connectDB();

  const { slug } = await params;
  const category = await Category.findOne({ slug }).lean();

  if (!category) {
    notFound();
  }

  const posts = await PostModel.find({
    status: 'published',
    category: category._id,
  })
    .populate('coverImage')
    .populate('author.picture')
    .sort({ date: -1 })
    .lean();

  const morePosts = posts.map((post) => {
    const coverImage = typeof post.coverImage === 'object' && post.coverImage !== null
      ? (post.coverImage as any).url
      : (post.coverImage as string) || '';

    return {
      title: post.title,
      coverImage: coverImage || '/assets/blog/preview/cover.jpg',
      date: post.date.toISOString(),
      excerpt: post.excerpt,
      author: {
        name: post.author.name,
        picture: typeof post.author.picture === 'object' && post.author.picture !== null
          ? (post.author.picture as any).url
          : (post.author.picture as string) || '',
      },
      slug: post.slug,
      ogImage: {
        url: coverImage || '/assets/blog/preview/cover.jpg',
      },
      content: '',
    };
  });

  return (
    <main>
      <Container>
        <Header />
        <section>
          <h1 className="mb-8 text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg mb-8">{category.description}</p>
          )}
          {morePosts.length > 0 ? (
            <MoreStories posts={morePosts} />
          ) : (
            <p className="text-center text-gray-500">No posts found in this category.</p>
          )}
        </section>
      </Container>
    </main>
  );
}

export async function generateStaticParams() {
  await connectDB();
  const categories = await Category.find().lean();

  return categories.map((category) => ({
    slug: category.slug,
  }));
}
