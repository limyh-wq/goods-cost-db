/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // xlsx is a CommonJS dependency that should not be bundled into edge/optimized output
  serverExternalPackages: ["xlsx"],
};

export default nextConfig;
