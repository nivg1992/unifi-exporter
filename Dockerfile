FROM node:18-alpine

RUN npm i -g pnpm ts-node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package.json pnpm-lock.yaml ./

RUN pnpm install

# Bundle app source
COPY . .

CMD [ "ts-node", "index.ts" ]