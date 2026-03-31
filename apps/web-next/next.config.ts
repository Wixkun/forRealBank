import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  async redirects() {
    return [
      {
        source: '/:locale(fr|en)/news',
        destination: '/:locale/dashboard',
        permanent: false,
      },
      {
        source: '/:locale(fr|en)/news/manage',
        destination: '/:locale/dashboard',
        permanent: false,
      },
      {
        source: '/:locale(fr|en)/news/create',
        destination: '/:locale/dashboard',
        permanent: false,
      },
      {
        source: '/:locale(fr|en)/notifications',
        destination: '/:locale/dashboard',
        permanent: false,
      },

      {
        source: '/:locale(fr|en)/advisor/chat',
        destination: '/:locale/chat/manage',
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
