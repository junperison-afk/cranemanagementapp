/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // ビルド時にESLintの警告でビルドを止めない
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ビルド時にTypeScriptの型エラーでビルドを止めない（警告のみの場合）
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

