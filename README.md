# LoTaS — Logistics Management System 

**LoTaS** (Logistics Management System) — це сучасна full-stack платформа для автоматизації складської та транспортної логістики. Проєкт дозволяє координувати роботу між менеджерами, бухгалтерами та складськими працівниками в режимі реального часу.
---

## 🌐 Live Demo
You can access the running application online via the following link:
🔗 **[Live Demo on ngrok](https://untrustworthy-ruby-gnarly.ngrok-free.dev/)**

*(Note: The availability depends on the current status of the ngrok tunnel).*

---

##  Технологічний стек

Система побудована на базі розподіленої архітектури:

* **Frontend:** React (Vite), TypeScript, Tailwind CSS.
* **Backend:** ASP.NET Core 8 API, Entity Framework Core.
* **Database:** MySQL 8.0.
* **Infrastructure:** Docker & Docker Compose (контейнеризація), GitHub Actions (CI), Railway (Cloud Hosting).

---

## Системна архітектура

Проєкт використовує **контейнеризовану мікросервісну архітектуру**. Кожен компонент ізольований у власному Docker-контейнері:

1.  **`db`**: MySQL Server для надійного збереження даних.
2.  **`backend`**: API на .NET, що містить бізнес-логіку та обробку запитів.
3.  **`frontend`**: Клієнтський додаток на React для взаємодії з користувачем.



---

##  Локальний запуск (через Docker)

Завдяки Docker, ви можете запустити весь проєкт (БД + Бекенд + Фронтенд) однією командою.

### 1. Попередні вимоги
Переконайтеся, що у вас встановлені:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### 2. Клонування та запуск
Виконайте наступні команди у терміналі:

```bash
# Клонування репозиторію
git clone [https://github.com/your-username/LoTaS.git](https://github.com/your-username/LoTaS.git)
cd LoTaS

# Запуск усіх сервісів
docker-compose up -d --build
