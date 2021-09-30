FROM node:14
WORKDIR /usr/app

COPY package*.json ./

RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000 8080 8443
CMD ["npm", "start"]
