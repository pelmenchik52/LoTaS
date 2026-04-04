FROM node:20-alpine
WORKDIR /app

# Копіюємо маніфести пакетів і встановлюємо залежності
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Копіюємо решту файлів
COPY . .

# Відкриваємо порт Vite
EXPOSE 5173

# Запускаємо сервер розробки, дозволяючи доступ ззовні контейнера (--host)
CMD ["npm", "run", "dev", "--", "--host"]