FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

WORKDIR /usr/src/app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY packages/domain/package.json packages/domain/
COPY packages/application/package.json packages/application/
COPY packages/infrastructure/*/package.json packages/infrastructure/
COPY apps/api-nest/package.json apps/api-nest/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @forreal/domain build \
 && pnpm --filter @forreal/application build \
 && pnpm --filter @forreal/infrastructure-* build

RUN pnpm --filter api-nest build

WORKDIR /usr/src/app/apps/api-nest

EXPOSE 3001
CMD ["node", "dist/main.js"]