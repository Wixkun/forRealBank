import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:locale(fr|en)/advisor/news',
        destination: '/:locale/news/manage',
        permanent: false,
      },
      {
        source: '/:locale(fr|en)/advisor/news/create',
        destination: '/:locale/news/create',
        permanent: false,
      },
      {
        source: '/:locale(fr|en)/advisor/chat',
        destination: '/:locale/chat/manage',
        permanent: false,
      },
      {
        source: '/:locale(fr|en)/advisor/notifications',
        destination: '/:locale/notifications',
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
