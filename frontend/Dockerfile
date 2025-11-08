FROM node:22.12.0
WORKDIR /usr/src/frontend
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
EXPOSE 5173
CMD ["yarn", "dev", "--host"]
