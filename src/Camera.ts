import { Vector } from './math/Vector';

/**
 * Камера следует за игроком с плавной интерполяцией.
 * Преобразует мировые координаты в экранные.
 */
export class Camera {
  /** Позиция камеры в мировых координатах (центр экрана) */
  readonly position = new Vector();
  /** Целевая позиция для интерполяции */
  private readonly target = new Vector();

  /** Скорость сглаживания (чем выше — тем быстрее догоняет) */
  smoothness = 8;

  /** Screen shake — смещение от тряски */
  shakeX = 0;
  shakeY = 0;
  private shakeIntensity = 0;
  private shakeDuration = 0;

  /** Размеры viewport */
  width = 800;
  height = 600;

  /** Установить цель (позиция игрока) */
  setTarget(x: number, y: number): void {
    this.target.x = x;
    this.target.y = y;
  }

  /** Обновление интерполяции и screen shake */
  update(dt: number): void {
    // Плавная интерполяция к цели
    const t = 1 - Math.exp(-this.smoothness * dt);
    this.position.x += (this.target.x - this.position.x) * t;
    this.position.y += (this.target.y - this.position.y) * t;

    // Screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const intensity = this.shakeIntensity * (this.shakeDuration / 0.3);
      this.shakeX = (Math.random() - 0.5) * intensity * 2;
      this.shakeY = (Math.random() - 0.5) * intensity * 2;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  /** Запуск эффекта тряски экрана */
  shake(intensity: number, duration = 0.3): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  /** Преобразование мировых координат в экранные */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx - this.position.x + this.width / 2 + this.shakeX,
      y: wy - this.position.y + this.height / 2 + this.shakeY,
    };
  }

  /** Центрирование камеры мгновенно (начало игры) */
  snapTo(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.target.x = x;
    this.target.y = y;
  }

  /** Изменение размера viewport */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
