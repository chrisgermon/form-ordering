/** @type {import('next').NextConfig} */
// Cache-busting comment: Force rebuild at 2025-07-13 14:11:45 PM
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
