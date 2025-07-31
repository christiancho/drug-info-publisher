FROM node:18-alpine

WORKDIR /app

RUN corepack enable

# Copy backend package files
COPY package.json ./
RUN yarn install --production=false

# Copy source code
COPY . .

EXPOSE 3001

CMD ["yarn", "run", "start:dev"]