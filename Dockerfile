FROM mhart/alpine-node:latest

WORKDIR /broker
ADD src/* src/
ADD package.json package.json

RUN npm install

EXPOSE 1883
EXPOSE 8883
EXPOSE 443
CMD ["npm", "start"]