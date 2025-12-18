"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";

type Props = {
  slug: string;
  title: string;
};

export function Disqus({ slug, title }: Props) {
  const { resolvedTheme } = useTheme();
  
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  if (!repoId || !categoryId) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto mt-12">
      <Giscus
        id="comments"
        repo="mybesttools/azure-blog"
        repoId={repoId}
        category="Q&A"
        categoryId={categoryId}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        lang="en"
        loading="lazy"
      />
    </div>
  );
}

