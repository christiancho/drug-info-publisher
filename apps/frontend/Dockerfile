FROM node:18-alpine

WORKDIR /app

RUN corepack enable

COPY yarn.lock package.json ./
COPY apps/frontend/package.json ./apps/frontend/
RUN yarn install

COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend

EXPOSE 3000

CMD ["yarn", "dev"]