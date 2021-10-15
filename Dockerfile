FROM node:14.18-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN yarn install && yarn cache clean
COPY . /usr/src/app

ENTRYPOINT ["node", "index.js"]