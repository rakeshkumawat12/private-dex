/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Exclude test files and unnecessary files from the build
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    config.module.rules.push({
      test: /node_modules\/thread-stream\/(test|bench\.js|LICENSE|README\.md)/,
      loader: 'ignore-loader'
    });

    // Fallback for Node.js modules and optional dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        'pino-pretty': false,
        '@react-native-async-storage/async-storage': false,
      };
    } else {
      // Handle optional server-side dependencies
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'pino-pretty': false,
        '@react-native-async-storage/async-storage': false,
      };
    }

    return config;
  },
  // Disable Turbopack for now as it has issues with certain dependencies
  // turbopack: {},
}

module.exports = nextConfig
