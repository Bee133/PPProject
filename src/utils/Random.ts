/**
 * Утилиты для генерации случайных чисел.
 * Централизованный источник рандома для воспроизводимости и чистоты кода.
 */
export class Random {
  /** Случайное число в диапазоне [min, max) */
  static range(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /** Случайное целое в диапазоне [min, max] включительно */
  static int(min: number, max: number): number {
    return Math.floor(Random.range(min, max + 1));
  }

  /** Случайный элемент массива */
  static pick<T>(array: readonly T[]): T {
    return array[Random.int(0, array.length - 1)];
  }

  /** Перемешивание массива (Fisher-Yates) */
  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Random.int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** N уникальных случайных элементов */
  static pickN<T>(array: readonly T[], count: number): T[] {
    const shuffled = Random.shuffle([...array]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /** Случайный угол [0, 2π) */
  static angle(): number {
    return Random.range(0, Math.PI * 2);
  }

  /** Случайная точка на окружности заданного радиуса */
  static onCircle(radius: number): { x: number; y: number } {
    const a = Random.angle();
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  }

  /** Вероятность (0..1) */
  static chance(probability: number): boolean {
    return Math.random() < probability;
  }
}
