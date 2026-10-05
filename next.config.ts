import type { NextConfig } from "next";
import preset from "./image-preset.json";

/**
 * Размеры, под которые next/image пересобирает картинку.
 *
 * Каждый размер — это отдельная пересборка: исходник разворачивается
 * в память в сыром виде и там же живёт. Память на Railway оплачивается
 * поминутно и составляет 99% счёта, поэтому лишние размеры стоят денег.
 *
 * Оставлены только те, что реально встречаются в вёрстке: контейнер сайта
 * 1280 px, карточки каталога уже. Потолок берём из пресета картинок —
 * просить больше, чем есть в исходнике, бессмысленно.
 */
const MAX = preset.maxSide;
const steps = [384, 640, 828, 1080, 1400, 1920, 2200].filter((w) => w <= MAX);

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: steps,
    imageSizes: [96, 256, 384, 640],
    // Next 16 пускает только qualities из списка. В вёрстке используется
    // ровно одно значение — держим его и значение по умолчанию.
    qualities: [75, 85],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  poweredByHeader: false,
};

export default nextConfig;
