import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'img.buzzfeed.com',
      'v1.exercisedb.io',
      'maps.googleapis.com',
      'maps.gstatic.com',
      'maps.googleapis.com',
      'lh3.googleusercontent.com',
      'v2.exercisedb.io',
      'exercisedb.p.rapidapi.com',
      // Add other domains as needed
    ],
  },
};

export default nextConfig;
