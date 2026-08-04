# Публикация «Учёт Лочари» в Railway

Переменные: DATABASE_URL=file:/data/lochari.db, SESSION_SECRET (32+ символа), ADMIN_NAME, ADMIN_USERNAME, ADMIN_PASSWORD (10+ символов).

Создайте Railway Volume и подключите его по пути /data. Без Volume база будет потеряна при повторной публикации.

Railway использует Dockerfile автоматически. При первом старте создаётся структура базы и единственный владелец. При следующих запусках существующие данные не меняются.