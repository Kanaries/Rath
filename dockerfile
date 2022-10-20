FROM node:latest as build-stage
COPY . /app
WORKDIR /app
ENV NODE_OPTIONS=--max_old_space_size=2048
RUN npm config set registry https://registry.npmmirror.com
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set electron_mirror https://registry.npmmirror.com/mirrors/electron/
RUN npm set electron_mirror https://registry.npmmirror.com/mirrors/electron/
RUN yarn install
RUN yarn workspace rath-client build2

FROM nginx:latest
COPY --from=build-stage /app/packages/frontend/build /var/html/www/rath
CMD ["nginx", "-g", "daemon off;"]
