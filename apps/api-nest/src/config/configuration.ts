import { resolveEnvSecret } from '@forreal/infrastructure-jwt-nest';

export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  db: {
    host: process.env.DB_HOST ?? 'db',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'forreal',
    pass: process.env.DB_PASS ?? 'forreal',
    name: process.env.DB_NAME ?? 'forrealbank',
  },
  jwt: {
    secret: resolveEnvSecret('JWT_SECRET') ?? 'fallback',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
});
