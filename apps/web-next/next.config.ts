import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
};

export default withNextIntl(nextConfig);
