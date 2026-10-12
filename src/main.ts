import { Game } from './Game';

/**
 * Точка входа — инициализация canvas и запуск игры.
 */
function main(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas not found');
  }

  const game = new Game(canvas);
  game.start();

  // Очистка при закрытии страницы
  window.addEventListener('beforeunload', () => {
    game.stop();
  });
}

main();
