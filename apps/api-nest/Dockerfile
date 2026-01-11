FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

WORKDIR /usr/src/app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY apps/api-nest/package.json apps/api-nest/
COPY packages/domain/package.json packages/domain/
COPY packages/application/package.json packages/application/
COPY packages/infrastructure ./packages/infrastructure

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /usr/src/app/apps/api-nest

EXPOSE 3001
CMD ["node", "dist/main.js"]
