import cn from "classnames";
import Link from "next/link";
import Image from "next/image";

type Props = {
  title: string;
  src: string;
  slug?: string;
};

const CoverImage = ({ title, src, slug }: Props) => {
  const image = (
    <Image
      src={src}
      alt={`Cover Image for ${title}`}
      className={cn(
        "shadow-sm w-full h-auto max-w-full md:max-w-2xl mx-auto",
        {
          "hover:shadow-lg transition-shadow duration-200": slug,
        }
      )}
      width={1024}
      height={768}
      sizes="(max-width: 1024px) 100vw, 1024px"
      priority
    />
  );
  return (
    <div className="sm:mx-0">
      {slug ? (
        <Link href={`/posts/${slug}`} aria-label={title}>
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
};

export default CoverImage;
