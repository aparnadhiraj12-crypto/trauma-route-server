# --- Build/deps stage -------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production dependencies (uses lockfile for reproducibility)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Runtime stage -------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Back4App Containers injects its own PORT env var based on the app's
# "Port" setting; this is just the default used if none is set there.
ENV PORT=8080
ENV HOST=0.0.0.0

# Run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER appuser

EXPOSE 8080

CMD ["node", "server.js"]
