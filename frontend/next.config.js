/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack config for dev mode
  turbopack: {},
  // Webpack config for production builds
  webpack: (config, { isServer }) => {
    // Exclude test files and unnecessary files from thread-stream
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    // Ignore test files, benchmarks, and non-JS files from thread-stream
    config.module.rules.push({
      test: /node_modules[\\/]thread-stream[\\/](test|bench\.js|LICENSE|README\.md)/,
      loader: 'ignore-loader'
    });

    // Ignore pino-pretty (optional dependency)
    config.module.rules.push({
      test: /node_modules[\\/]pino-pretty/,
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
    }

    // Ignore certain problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };

    return config;
  },
  // Exclude problematic packages from server components bundling
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
}

module.exports = nextConfig
