import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 
   * Settings for S3/CloudFront static hosting:
   * - output: 'export' - Creates static HTML/CSS/JS files in the 'out' directory
   * - images.unoptimized: true - Needed for static export
   * - trailingSlash: true - Helps with S3/CloudFront routing
   * 
   * IMPORTANT: Static export (out/) works best for S3/CloudFront hosting
   * - Creates index.html as the entry point for CloudFront
   * - Supports client-side routing with proper CloudFront error page configuration
   */
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  /* Additional config options here */
};

export default nextConfig;
