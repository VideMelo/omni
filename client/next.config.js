/** @type {import('next').NextConfig} */
const nextConfig = {
   rewrites: async () => [
      {
         source: '/api/:path*',
         destination: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/:path*`,
      },
   ],

   webpack: (config, { isServer }) => {
      if (isServer) {
         config.externals.push({
            bufferutil: 'bufferutil',
            'utf-8-validate': 'utf-8-validate',
         });
      }

      config.module.rules.push({
         test: /\.svg$/,
         use: ['@svgr/webpack'],
      });

      return config;
   },

   images: {
      domains: ['cdn.discordapp.com', 'cdn.discord.com'],
   },
};

module.exports = nextConfig;
