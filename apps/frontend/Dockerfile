FROM node:18-alpine

WORKDIR /app

RUN corepack enable

# Copy package files
COPY package.json yarn.lock* ./
RUN yarn install

# Copy application code
COPY . .

EXPOSE 3000

CMD ["yarn", "dev"]