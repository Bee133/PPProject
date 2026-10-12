/**
 * Двумерный вектор с базовыми математическими операциями.
 * Используется для позиций, скоростей и направлений.
 */
export class Vector {
  constructor(
    public x: number = 0,
    public y: number = 0,
  ) {}

  /** Клонирование вектора */
  clone(): Vector {
    return new Vector(this.x, this.y);
  }

  /** Копирование значений из другого вектора */
  copyFrom(v: Vector): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  /** Сложение векторов */
  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  /** Вычитание векторов */
  sub(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y);
  }

  /** Умножение на скаляр */
  scale(s: number): Vector {
    return new Vector(this.x * s, this.y * s);
  }

  /** Длина вектора через Math.hypot */
  length(): number {
    return Math.hypot(this.x, this.y);
  }

  /** Нормализация — единичный вектор направления */
  normalize(): Vector {
    const len = this.length();
    if (len === 0) return new Vector(0, 0);
    return new Vector(this.x / len, this.y / len);
  }

  /** Расстояние до другой точки */
  distanceTo(v: Vector): number {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  /** Линейная интерполяция к целевому вектору */
  lerp(target: Vector, t: number): Vector {
    return new Vector(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t,
    );
  }

  /** Поворот вектора на угол (радианы) */
  rotate(angle: number): Vector {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  /** Угол вектора относительно оси X */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /** Создание единичного вектора по углу */
  static fromAngle(angle: number): Vector {
    return new Vector(Math.cos(angle), Math.sin(angle));
  }

  /** Нулевой вектор */
  static zero(): Vector {
    return new Vector(0, 0);
  }
}
