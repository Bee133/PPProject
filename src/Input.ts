/**
 * Обработка ввода с клавиатуры.
 * Отслеживает состояние клавиш WASD и действия UI.
 */
export class Input {
  private readonly keys = new Set<string>();
  private readonly justPressed = new Set<string>();

  /** Привязка обработчиков к window */
  attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** Отвязка обработчиков */
  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  /** Вызывается в начале каждого кадра — сброс однократных нажатий */
  update(): void {
    this.justPressed.clear();
  }

  /** Зажата ли клавиша */
  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  /** Нажата ли клавиша в этом кадре */
  isPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  /** Вектор направления движения WASD (-1..1) */
  getMovement(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    return { x, y };
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (!this.keys.has(e.code)) {
      this.justPressed.add(e.code);
    }
    this.keys.add(e.code);

    // Предотвращаем прокрутку страницы стрелками и пробелом
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };
}
