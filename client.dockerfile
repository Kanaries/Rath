FROM node:16 as build-stage
COPY . /app
WORKDIR /app
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm config set registry https://registry.npmmirror.com
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn install
RUN yarn workspace rath-client build2

FROM nginx:latest
COPY --from=build-stage /app/packages/rath-client/build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
