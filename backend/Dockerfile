FROM node:22-alpine AS base

# Update repository URLs for Alpine packages
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories || true
RUN sed -i 's/alpine.gliderlabs.com/dl-cdn.alpinelinux.org/g' /etc/apk/repositories || true

# Install Chromium and dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

# Stage 2: Build the application
FROM base AS build

WORKDIR /app

# Copy installed dependencies from the base stage
COPY --from=base /app/node_modules ./node_modules

# Copy application source code
COPY . .

# If you have a build step, uncomment the next line
# RUN yarn run build

# Stage 3: Production image
FROM node:22-alpine AS production

# Update repository URLs for Alpine packages in the production stage as well
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories || true
RUN sed -i 's/alpine.gliderlabs.com/dl-cdn.alpinelinux.org/g' /etc/apk/repositories || true

# Install Chromium and dependencies for runtime
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Copy the built application from the build stage
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/node_modules ./node_modules
# If you built your app in the build stage, copy the dist folder or other necessary files.
# COPY --from=build /app/dist ./dist

# If you have other files (like static assets, etc.) that are needed, copy them as well.
# COPY --from=build /app/public ./public

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 9000

CMD [ "yarn", "start" ]
