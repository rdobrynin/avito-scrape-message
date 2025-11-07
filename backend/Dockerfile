FROM node:22-alpine AS base

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile


# Stage 2: Build the application (if applicable)
FROM base AS build

# Copy installed dependencies from the previous stage
COPY --from=base /app/node_modules ./node_modules

# Copy application source code
COPY . /app

# Run build command (if your project requires one)
# RUN yarn run build

# Stage 3: Production image
FROM node:23-alpine AS production

# Set working directory
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/node_modules ./node_modules

# Copy your application code (adjust based on your project structure)
COPY --from=build /app ./

# Expose port and define startup command
EXPOSE 9000

CMD [ "yarn", "start" ]
