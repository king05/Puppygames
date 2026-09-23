FROM node:20-alpine

# Wichtig für better-sqlite3 Kompilierung auf Alpine Linux
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Datenordner für die SQLite Datenbank erstellen
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "start"]