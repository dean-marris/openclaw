import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: '/Users/deanmarris/My Drive/marris_openclaw/mission-control/dashboard',
  },
  // pdf-parse uses Node.js internals and must run in Node runtime, not Edge
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
}

export default nextConfig
