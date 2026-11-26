
import type {NextConfig} from 'next';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});


const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    middlewareClientMaxBodySize: '500mb',
    serverActions: {
      bodySizeLimit: '1GB', // Allow up to 1GB for large media/video backups
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fixbro.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'my.fixbro.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ad.fixbro.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'in.fixbro.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.fixbro.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
