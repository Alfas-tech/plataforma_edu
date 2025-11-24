/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize webpack cache serialization to use Buffer for large strings
    // This prevents "Serializing big strings impacts deserialization performance" warning
    if (config.cache && typeof config.cache === "object") {
      config.cache.maxMemoryGenerations = 1;
    }
    return config;
  },
};

export default nextConfig;
