const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  allowedDevOrigins: ['192.168.0.5'],
  turbopack: {
    root: path.join(__dirname),
  },
}

module.exports = nextConfig
