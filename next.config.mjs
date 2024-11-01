/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_HOSTNAME: 'http://localhost:3000/api/',
    MONGODB_URI: 'mongodb://localhost:27017/laserU',
    NEXTAUTH_SECRET: 'codingmstrsecret',
    NEXTAUTH_URL: 'http://localhost:3000',
    SECRET: 'RAMDOM_STRING',
  },
  eslint: {
    dirs: ['pages', 'utils'], // Only run ESLint on the 'pages' and 'utils' directories during production builds (next build)
  },
};

export default nextConfig;
