FROM node:8.8.1
EXPOSE 3000
WORKDIR /usr/store-service
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
COPY . .
CMD ["node", "index.js"]
