# Version 1.0.0
FROM node:10.16.3

LABEL SJCZ "626040875@qq.com"

RUN mkdir -p /src/app
WORKDIR /src/app
COPY . /src/app/

RUN npm config set registry https://registry.npm.taobao.org && npm i

# 头像文件夹
VOLUME /src/app/avatars

EXPOSE 9090
EXPOSE 10010

CMD ["npm", "run", "start"]