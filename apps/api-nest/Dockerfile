FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

WORKDIR /usr/src/app

COPY . .

RUN pnpm install --frozen-lockfile

RUN find . -name "*.tsbuildinfo" -delete


RUN pnpm --filter @forreal/domain build \
 && pnpm --filter @forreal/application build \
 && pnpm --filter @forreal/infrastructure-* build

RUN pnpm --filter api-nest build

WORKDIR /usr/src/app/apps/api-nest

EXPOSE 3001
CMD ["node", "dist/main.js"]
