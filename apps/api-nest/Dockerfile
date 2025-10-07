FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
ENV CI=true
WORKDIR /usr/src/app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY apps/api-nest/package.json ./apps/api-nest/

COPY apps/api-nest/tsconfig.json apps/api-nest/tsconfig.build.json apps/api-nest/nest-cli.json ./apps/api-nest/

RUN pnpm install --filter api-nest... --frozen-lockfile

COPY . .

WORKDIR /usr/src/app/apps/api-nest
EXPOSE 3001
CMD ["pnpm", "start:dev"]
