/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  allowedDevOrigins: ['192.168.56.1', 'localhost', 'bcb4-103-135-24-185.ngrok-free.app'],
}

export default nextConfig