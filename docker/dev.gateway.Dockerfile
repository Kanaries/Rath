FROM nginx:1.24

COPY docker/nginx.dev.conf /etc/nginx/conf.d/default.conf
