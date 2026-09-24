"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Видео в статье через фасад: сначала постер, iframe подключается по клику.
 *
 * Без фасада YouTube тянет около 500 КБ скриптов ещё до того, как человек
 * решил смотреть, и роняет LCP. Локальный MP4 грузится с preload="none"
 * по той же причине.
 */
export function VideoEmbed({
  src, poster, title,
}: {
  src: string;
  poster: string;
  title: string;
}) {
  const [live, setLive] = useState(false);
  const isFile = /\.(mp4|webm|mov)$/i.test(src);

  if (live && isFile) {
    return (
      <figure className="my-8">
        <video
          src={src}
          poster={poster}
          controls
          autoPlay
          preload="none"
          className="w-full rounded-[var(--radius-card)] bg-black"
        >
          <track kind="captions" />
        </video>
        <figcaption className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">{title}</figcaption>
      </figure>
    );
  }

  if (live) {
    return (
      <figure className="my-8">
        <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-black">
          <iframe
            src={src.includes("?") ? `${src}&autoplay=1` : `${src}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
        <figcaption className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">{title}</figcaption>
      </figure>
    );
  }

  return (
    <figure className="my-8">
      <button
        type="button"
        onClick={() => setLive(true)}
        aria-label={`Смотреть: ${title}`}
        className="group relative block aspect-video w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-canvas-2)]"
      >
        {/* Постер обязателен: без него блок схлопывается и даёт скачок вёрстки */}
        <Image src={poster} alt="" fill sizes="(max-width: 1024px) 100vw, 760px" className="object-cover" />
        <span className="absolute inset-0 bg-[rgb(20_17_16/0.35)] transition-colors group-hover:bg-[rgb(20_17_16/0.2)]" />
        <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] transition-transform group-hover:scale-105">
          <Play size={26} fill="currentColor" />
        </span>
      </button>
      <figcaption className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">{title}</figcaption>
    </figure>
  );
}
