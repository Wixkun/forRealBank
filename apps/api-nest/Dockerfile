FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
ENV CI=true

WORKDIR /usr/src/app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY apps/api-nest/package.json ./apps/api-nest/
COPY packages/infrastructure/typeorm/package.json ./packages/infrastructure/typeorm/
COPY packages/infrastructure/crypto-bcrypt/package.json ./packages/infrastructure/crypto-bcrypt/
COPY packages/infrastructure/jwt-nest/package.json ./packages/infrastructure/jwt-nest/
COPY packages/domain/package.json ./packages/domain/
COPY packages/application/package.json ./packages/application/

RUN pnpm install --filter api-nest... --frozen-lockfile --include-workspace-root

COPY . .

WORKDIR /usr/src/app/apps/api-nest
EXPOSE 3001

CMD ["pnpm", "exec", "nest", "start", "--watch"]
