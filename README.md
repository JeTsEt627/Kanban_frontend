# Kanban Frontend

Минимальная структура фронтенда на React + Vite (TypeScript).

Быстрый старт (PowerShell):

```powershell
# Перейти в папку frontend
cd .\frontend

# Установить зависимости (npm или yarn)
npm install
# или
# yarn

# Запустить dev-сервер
npm run dev
# Откроется http://localhost:3000
```

Примечания:
- Vite настроен с прокси `/api` -> `http://localhost:8000` (см. `vite.config.ts`). Если backend слушает на другом порте, отредактируйте прокси.
- Этот репозиторий содержит минимальную основу. Добавьте роутинг, менеджер состояний и тесты по необходимости.
