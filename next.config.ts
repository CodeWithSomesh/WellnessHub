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
      'apipics.s3.amazonaws.com',
      'www.themealdb.com',
      'v2.exercisedb.io/image/',
      'i.giphy.com',           // Common GIF hosting
      'media.giphy.com',       // Another Giphy domain
      'v1.exercisedb.io',      // Make sure this is included
      'assets.rapidapi.com', 
      // Add other domains as needed
    ],
  },
};

export default nextConfig;
