import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The prompt is a plain file read at run time, so it has to travel with the server code.
  outputFileTracingIncludes: {
    "/**": ["./settings/**/*"],
  },
};

export default nextConfig;
