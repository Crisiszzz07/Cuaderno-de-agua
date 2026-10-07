FROM docker.io/library/node:24-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY astro.config.ts tsconfig.json tokens.css ./
COPY src ./src
COPY scripts ./scripts
COPY public ./public
RUN pnpm build

FROM docker.io/library/node:24-alpine AS serve
WORKDIR /app
ENV NODE_ENV=production
RUN mkdir -p /app/runtime-secrets && touch /app/runtime-secrets/private-cover.json && chown -R node:node /app/runtime-secrets
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY server ./server
COPY src/domain ./src/domain
COPY src/application/live-activity.ts src/application/evaluate-live.ts ./src/application/
COPY src/infrastructure/memory-live-store.ts src/infrastructure/live-questions.ts src/infrastructure/scenarios.ts ./src/infrastructure/
COPY src/shared/live-constants.ts ./src/shared/
USER node
EXPOSE 8080
CMD ["node", "server/live.ts"]
