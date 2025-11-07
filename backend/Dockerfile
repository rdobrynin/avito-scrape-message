FROM node:22-alpine AS base

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories || true
RUN sed -i 's/alpine.gliderlabs.com/dl-cdn.alpinelinux.org/g' /etc/apk/repositories || true

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# 2. Tell Puppeteer to skip its default download and use the system Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile


# Stage 2: Build the application (if applicable)
FROM base AS build

# Copy installed dependencies from the previous stage
COPY --from=base /app/node_modules ./node_modules

# Copy application source code
COPY . /app

# Install Chrome and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Install Chrome browser for Puppeteer
RUN yarn dlx puppeteer browsers install chrome

# Run build command (if your project requires one)
# RUN yarn run build

# Stage 3: Production image
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Install Chrome and necessary dependencies for runtime
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy only necessary files from the build stage
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/node_modules ./node_modules

# Copy your application code (adjust based on your project structure)
COPY --from=build /app ./

# Create a non-root user to run the application (security best practice)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port and define startup command
EXPOSE 9000

CMD [ "yarn", "start" ]
