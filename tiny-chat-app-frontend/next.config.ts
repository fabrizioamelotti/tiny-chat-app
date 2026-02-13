import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    API_PATH: process.env.NEXT_PUBLIC_BACKEND_PATH,
  },
}

export default nextConfig
