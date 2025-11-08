FROM node:22.12.0
WORKDIR /usr/src/frontend

# Copy package files first for better caching
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application (if needed)
# RUN yarn build

EXPOSE 5173

CMD ["yarn", "dev", "--host", "0.0.0.0"]
#CMD ["yarn", "dev", "--host"]
