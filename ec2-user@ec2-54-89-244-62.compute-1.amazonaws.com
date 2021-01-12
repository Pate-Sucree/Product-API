FROM node:12
WORKDIR /usr/src/app
COPY . .
RUN yarn install
EXPOSE 4000
CMD ["node", "server.js"]