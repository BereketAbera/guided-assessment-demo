import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This folder is the whole project, even when it sits inside a larger workspace.
  outputFileTracingRoot: path.resolve("."),
  // The prompt is a plain file read at run time, so it has to travel with the server code.
  outputFileTracingIncludes: {
    "/**": ["./settings/**/*"],
  },
};

export default nextConfig;
