FROM node:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV TZ=Asia/Kolkata
EXPOSE 5000

CMD ["npm", "start"]
