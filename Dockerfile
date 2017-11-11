FROM node:8.9-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN yarn install && yarn cache clean
COPY . /usr/src/app

ENTRYPOINT ["node", "index.js"]