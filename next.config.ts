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
};

module.exports = nextConfig;