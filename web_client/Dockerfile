FROM node:lts-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g @react-native-community/cli

COPY . .

RUN npm run build

FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create shared directory for APK
RUN mkdir -p /shared

EXPOSE 80

# Wait for APK from mobile client, then start nginx
CMD sh -c '\
  echo "Waiting for /shared/client_mobile.txt..." && \
  while [ ! -f /shared/client_mobile.txt ]; do sleep 1; done && \
  echo "Mobile client completed. APK available at /shared/client.apk" && \
  nginx -g "daemon off;"\
'
