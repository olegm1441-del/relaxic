import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image пересобирает картинку под размер экрана и отдаёт AVIF или WebP.
    // Поэтому в репозитории лежат исходники 2200 px: пользователь их целиком
    // не качает, а запас под ретину и крупные экраны сохраняется.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1440, 1920, 2200],
    imageSizes: [96, 128, 256, 384, 512, 640],
    // Next 16 пускает только quality из белого списка, по умолчанию [75].
    // Без этого <Image quality={85}> отдаёт 400 в продакшене.
    qualities: [50, 60, 75, 85, 90],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  poweredByHeader: false,
};

export default nextConfig;
