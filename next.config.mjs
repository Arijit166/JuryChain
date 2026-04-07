/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['mongoose', 'poseidon-lite', '@semaphore-protocol/core', '@zk-kit/poseidon-cipher', 'hardhat', 'ethers'],
}

export default nextConfig
