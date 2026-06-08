const repoBase = (process.env.BASE_PATH ?? "/space365-led-matrix").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: repoBase || undefined,
  assetPrefix: repoBase || undefined,
  trailingSlash: true,
  typedRoutes: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
