FROM node:20.10.0-alpine as builder
LABEL maintainer="Jisu Kim <webmaster@alien.moe>"

WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./

# Add libvips
RUN apk add --upgrade --no-cache vips-dev build-base --repository https://alpine.global.ssl.fastly.net/alpine/v3.10/community/

# Install Dependncies
RUN corepack enable && yarn install

COPY . .
RUN yarn build


FROM node:20.10.0-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json yarn.lock ./

# Add libvips
RUN apk add --upgrade --no-cache vips-dev build-base --repository https://alpine.global.ssl.fastly.net/alpine/v3.10/community/

# Install Dependncies
RUN corepack enable && yarn workspaces focus --all --production

RUN set -x \
  && apk add --no-cache \
  dcron bash

RUN touch /var/log/crawl.log

ENV API_KEY="" \
  POST_ID="" \
  INITIAL_ETAG="" \
  SCHEDULE="*/30 * * * *"

VOLUME ["/app/data"]

COPY ./docker-entrypoint.sh /
ENTRYPOINT /docker-entrypoint.sh
