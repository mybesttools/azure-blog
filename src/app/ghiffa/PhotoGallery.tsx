'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLang } from './LanguageContext';

const AUTO_ADVANCE_MS = 5000;

export function PhotoGallery({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useLang();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (images.length <= 1 || paused) return;

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images.length, paused]);

  if (images.length === 0) return null;

  const goTo = (next: number) => {
    setIndex((next + images.length) % images.length);
  };

  return (
    <div
      className="mt-8 relative w-full md:w-1/2 aspect-[16/9] rounded-xl overflow-hidden shadow-md group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className={`object-cover transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          priority={i === 0}
        />
      ))}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={t.galleryPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={t.galleryNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            &rarr;
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}/${images.length}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
