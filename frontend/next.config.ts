import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? "/Napier" : "",
  assetPrefix: isGithubPages ? "/Napier/" : undefined,
  trailingSlash: true,
};

export default nextConfig;
