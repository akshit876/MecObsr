/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_HOSTNAME: 'http://localhost:3000/api/',
    MONGODB_URI: 'mongodb://localhost:27017/main-data',
    NEXTAUTH_SECRET: 'codingmstrsecret',
    NEXTAUTH_URL: 'http://localhost:3000',
    SECRET: 'RAMDOM_STRING',
  },
  eslint: {
    // Only run ESLint on these directories during production builds
    // dirs: ['pages', 'components', 'lib', 'utils', 'hooks'],
    // Don't run ESLint during builds (you can still run it separately)
    ignoreDuringBuilds: true,
  },
  // next.config.js

  // webpack: (config, { dev, isServer }) => {
  //   if (dev && !isServer) {
  //     config.watchOptions = {
  //       poll: 1000, // Check for changes every second
  //       aggregateTimeout: 300, // Delay before rebuilding
  //     };
  //     config.cache = false; // Disabling cache explicitly
  //   }
  //   return config;
  // },
};

export default nextConfig;
