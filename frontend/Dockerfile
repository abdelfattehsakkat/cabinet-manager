FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:1.25-alpine


# Copie le build Angular
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# Copie le config.json par défaut (modifiable par volume Docker)
COPY src/assets/config.json /usr/share/nginx/html/assets/config.json

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
