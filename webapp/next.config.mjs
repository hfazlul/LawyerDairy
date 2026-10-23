/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['firebase-admin', 'nodemailer'],
  async redirects() {
    return [
      { source: '/login', destination: '/user/login', permanent: false },
      { source: '/signup', destination: '/user/signup', permanent: false },
      { source: '/forgot-password', destination: '/user/forgot', permanent: false },
      { source: '/dashboard', destination: '/user', permanent: false },
      { source: '/dashboard/clients', destination: '/user', permanent: false },
      { source: '/dashboard/documents', destination: '/user', permanent: false },
      { source: '/dashboard/checkout/:path*', destination: '/user/member', permanent: false },
      { source: '/dashboard/:path*', destination: '/user/:path*', permanent: false },
      { source: '/packages', destination: '/package', permanent: false },
      { source: '/checkout', destination: '/package', permanent: false },
      { source: '/admin', destination: '/hfazlul', permanent: false },
      { source: '/admin/:path*', destination: '/hfazlul/:path*', permanent: false },
    ]
  },
}

export default nextConfig
