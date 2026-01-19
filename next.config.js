/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Disable image optimization for static export compatibility
  },
}

module.exports = nextConfig
