# Top-Down Arena Survivor

Survivor-style top-down arena shooter на TypeScript + HTML5 Canvas + Vite.
## cd "Top-Down Arena Survivor"
## npm install
## npm run dev

## Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:5173 в браузере.

## Сборка

```bash
npm run build
npm run preview
```

## Управление

- **WASD** / **Стрелки** — движение
- **1, 2, 3** — выбор улучшения при level-up
- **Enter / Space** — начать игру / играть снова
- Стрельба автоматическая

## Стек

- TypeScript (strict mode)
- HTML5 Canvas API (без игровых движков)
- Vite
- Модульная архитектура

## Особенности

- Плавное движение с ускорением
- 4 вида оружия (пистолет, дробовик, лазер, ракета)
- Система улучшений при повышении уровня
- Object Pool для пуль и частиц
- QuadTree для коллизий при >300 врагах
- Неоновый визуальный стиль с glow-эффектами
- Screen shake, частицы, след за игроком
