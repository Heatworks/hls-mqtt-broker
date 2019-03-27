ARG node=node

FROM $node:8

WORKDIR /broker

ADD src/ src/
ADD package.json package.json
ADD Procfile Procfile

RUN npm install

# ADD certs/ certs/

EXPOSE 1883
EXPOSE 1884
EXPOSE 8883
CMD ["npm", "start"]