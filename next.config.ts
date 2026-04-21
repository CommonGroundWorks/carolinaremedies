import type { NextConfig } from "next";

// Derive the production hostname from NEXT_PUBLIC_APP_URL so server actions
// are allowed from any deployment domain (Vercel, Railway, custom, etc.)
const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
const appHostname = appUrl ? new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`).host : ''

const allowedOrigins = [
  'localhost:3000',
  'localhost:7000',
  '127.0.0.1:7000',
  ...(appHostname ? [appHostname] : []),
]

const nextConfig: NextConfig = {
  // Enable experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    serverActions: {
      allowedOrigins,
    }
  },

  // Output standalone for Docker deployments
  output: 'standalone',

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      // Supabase Storage — product images uploaded via the admin or seed importer
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Unsplash (placeholder images during development)
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // PWA support (future enhancement)
  // Will be enabled later when needed
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

export default nextConfig;