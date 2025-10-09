FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY pnpm-lock.yaml* package.json pnpm-workspace.yaml ./

COPY apps/web-next/package.json apps/web-next/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter web-next... build


FROM node:20-alpine AS runner
WORKDIR /usr/src/app/apps/web-next

ENV NODE_ENV=production
RUN npm install -g pnpm

COPY --from=builder /usr/src/app/apps/web-next/.next ./.next
COPY --from=builder /usr/src/app/apps/web-next/public ./public
COPY --from=builder /usr/src/app/apps/web-next/package.json ./package.json
COPY --from=builder /usr/src/app/apps/web-next/node_modules ./node_modules

COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

EXPOSE 3000
CMD ["pnpm", "start"]
