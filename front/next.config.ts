// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/visualcrossing/WeatherIcons/main/**',
      },
    ],
  },
  typescript: {
    // ⚠️ 주의: 타입 에러가 있어도 무시하고 빌드합니다.
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ 주의: 린트 에러가 있어도 무시하고 빌드합니다.
    ignoreDuringBuilds: true,
  },
  // ▲▲▲ 여기까지 ▲▲▲
};

module.exports = nextConfig;