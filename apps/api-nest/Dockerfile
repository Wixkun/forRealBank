FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY apps/api-nest/package.json apps/api-nest/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/application/package.json packages/application/package.json
COPY packages/infrastructure/crypto-bcrypt/package.json packages/infrastructure/crypto-bcrypt/package.json
COPY packages/infrastructure/jwt-nest/package.json packages/infrastructure/jwt-nest/package.json
COPY packages/infrastructure/mongodb/package.json packages/infrastructure/mongodb/package.json
COPY packages/infrastructure/typeorm/package.json packages/infrastructure/typeorm/package.json
COPY packages/infrastructure/uuid-node/package.json packages/infrastructure/uuid-node/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN find . -name "*.tsbuildinfo" -delete

RUN pnpm --filter @forreal/domain build \
 && pnpm --filter @forreal/application build \
 && pnpm --filter @forreal/infrastructure-* build \
 && pnpm --filter api-nest build

RUN pnpm deploy --filter api-nest --prod --legacy /prod


FROM node:20-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=build /prod ./

EXPOSE 3001

CMD ["node", "dist/apps/api-nest/src/main.js"]