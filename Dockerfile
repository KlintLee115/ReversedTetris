FROM node:alpine3.19 as base

copy package*.json .

run npm i

CMD npm run dev