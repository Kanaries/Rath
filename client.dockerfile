FROM node:16 AS build-stage

COPY . /app

WORKDIR /app

RUN yarn install

RUN yarn workspace rath-client buildOnDocker

FROM nginx:1.24

COPY --from=build-stage /app/packages/rath-client/build /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]
