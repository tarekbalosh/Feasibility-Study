/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Proxy /local-api/* → http://localhost:8080/api/* (server-side, no CORS)
  async rewrites() {
    return [
      {
        source: '/local-api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
