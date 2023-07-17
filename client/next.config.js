/** @type {import('next').NextConfig} */
const nextConfig = {
   rewrites: async () => [
      {
         source: '/api/:path*',
         destination: 'http://localhost:8080/api/:path*',
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
      })

      return config
   },

   images: {
      domains: ['cdn.discordapp.com', 'cdn.discord.com']
   },
}

module.exports = nextConfig
