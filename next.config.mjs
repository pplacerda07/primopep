/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // /form é um atalho para o formulário do GHK-Cu. A query (UTM, fbclid) vai junto.
  async redirects() {
    return [{ source: '/form', destination: '/ghk-cu', permanent: false }]
  },
}

export default nextConfig
