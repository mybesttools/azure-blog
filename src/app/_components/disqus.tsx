"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";

type Props = {
  slug: string;
  title: string;
};

export function Disqus({ slug, title }: Props) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="max-w-5xl mx-auto mt-12">
      <Giscus
        id="comments"
        repo="mybesttools/azure-blog"
        repoId="348095374"
        category="Q&A"
        categoryId="DIC_kwDOFL-Djs4Cz9sL"
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

