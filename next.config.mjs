/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_HOSTNAME: 'http://localhost:3000/api/',
    MONGODB_URI: 'mongodb://localhost:27017/main-data',
    NEXTAUTH_SECRET: 'codingmstrsecret',
    NEXTAUTH_URL: 'http://localhost:3000',
    SECRET: 'RAMDOM_STRING',
  },
  typescript: {
    // ⚠️ Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Only run ESLint on these directories during production builds
    // dirs: ['pages', 'components', 'lib', 'utils', 'hooks'],
    // Don't run ESLint during builds (you can still run it separately)
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Fix source map issues with react-toastify
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }

    // Ignore source map warnings for react-toastify
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /ENOENT: no such file or directory.*\.map$/,
    ];

    return config;
  },
};

export default nextConfig;
