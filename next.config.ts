import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 동료가 사내망 IP로 접속할 때 dev 리소스(HMR 등) cross-origin 허용
  allowedDevOrigins: ["192.168.60.120"],
};

export default nextConfig;
