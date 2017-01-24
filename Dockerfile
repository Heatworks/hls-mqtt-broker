FROM mhart/alpine-node:latest

WORKDIR /broker

ADD src/ src/
ADD package.json package.json
ADD Procfile Procfile

RUN npm install

EXPOSE 1883
EXPOSE 1884
EXPOSE 8883
CMD ["npm", "start"]