import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle paapi5-nodejs-sdk which uses AMD modules
    if (!isServer) {
      // For client-side, exclude it completely since it's server-only
      config.resolve.alias = {
        ...config.resolve.alias,
        'paapi5-nodejs-sdk': false,
      };
    } else {
      // For server-side, use externals to prevent bundling
      // The package will be required at runtime by Node.js
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request?.includes('paapi5-nodejs-sdk')) {
            return callback(undefined, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }

    return config;
  },
};

export default nextConfig;
