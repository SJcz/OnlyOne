# Version 1.0.0
FROM node:10.16.3

MAINTAINER SJCZ "626040875@qq.com"

RUN mkdir -p /src/app
WORKDIR /src/app
COPY . /src/app/

RUN npm config set registry https://registry.npm.taobao.org && npm i

EXPOSE 9090

CMD ["npm", "run", "start"]