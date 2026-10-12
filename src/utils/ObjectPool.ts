/**
 * Универсальный пул объектов для минимизации аллокаций памяти.
 * Объекты переиспользуются вместо создания новых экземпляров каждый кадр.
 */
export class ObjectPool<T> {
  private readonly pool: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 32) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /** Получить объект из пула или создать новый */
  acquire(): T {
    const obj = this.pool.pop();
    if (obj) {
      this.reset(obj);
      return obj;
    }
    return this.factory();
  }

  /** Вернуть объект в пул */
  release(obj: T): void {
    this.pool.push(obj);
  }

  /** Текущий размер свободного пула */
  get available(): number {
    return this.pool.length;
  }
}
