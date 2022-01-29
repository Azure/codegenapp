FROM node:14-alpine

RUN  apk update && apk upgrade && apk add --no-cache  git>=2.29.1-r0 curl --repository http://dl-cdn.alpinelinux.org/alpine/edge/main && apk add --no-cache python3 py3-pip make g++

WORKDIR /usr/app

COPY package*.json ./

RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000 8080 8443
CMD ["npm", "start"]
