FROM node:lts-alpine

EXPOSE 3000
COPY . ./
RUN rm -f .env .env.* || true
RUN npm install

CMD ["npm", "start" ]
