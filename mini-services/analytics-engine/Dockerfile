# ── Backend: Analytics Engine (Bun) ──
FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json ./
RUN bun install

COPY prisma/ ./prisma/
RUN bunx prisma generate

COPY . .

EXPOSE 3030
ENV PORT=3030
ENV DATABASE_URL="file:/data/custom.db"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3030/health || exit 1

CMD ["bun", "index.ts"]
