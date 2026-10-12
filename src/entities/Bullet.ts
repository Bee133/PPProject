import { Vector } from '../math/Vector';
import { WeaponType } from '../types';

/**
 * Пуля — летит по направлению, может пробивать врагов.
 * Управляется через Object Pool для оптимизации.
 */
export class Bullet {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  radius = 4;
  damage = 10;
  speed = 500;
  /** Сколько врагов может пробить (0 = исчезает при первом попадании) */
  pierce = 0;
  /** ID врагов, в которых уже попала (для pierce) */
  hitIds = new Set<number>();
  weaponType: WeaponType = 'pistol';
  color = '#00f0ff';
  glowColor = '#00f0ff';
  active = false;
  /** Уникальный ID для отслеживания попаданий */
  id = 0;
  /** Время жизни (секунды) — защита от зависших пуль */
  lifetime = 3;
  age = 0;
  /** Взрывной радиус (для ракет) */
  explosionRadius = 0;

  /** Сброс состояния при возврате в пул */
  reset(): void {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 4;
    this.damage = 10;
    this.speed = 500;
    this.pierce = 0;
    this.hitIds.clear();
    this.weaponType = 'pistol';
    this.color = '#00f0ff';
    this.glowColor = '#00f0ff';
    this.active = false;
    this.lifetime = 3;
    this.age = 0;
    this.explosionRadius = 0;
  }

  /** Инициализация пули при выстреле */
  init(
    x: number,
    y: number,
    direction: Vector,
    damage: number,
    speed: number,
    radius: number,
    pierce: number,
    weaponType: WeaponType,
    color: string,
    glowColor: string,
    id: number,
    explosionRadius = 0,
  ): void {
    this.x = x;
    this.y = y;
    this.vx = direction.x * speed;
    this.vy = direction.y * speed;
    this.damage = damage;
    this.speed = speed;
    this.radius = radius;
    this.pierce = pierce;
    this.weaponType = weaponType;
    this.color = color;
    this.glowColor = glowColor;
    this.id = id;
    this.explosionRadius = explosionRadius;
    this.active = true;
    this.age = 0;
    this.hitIds.clear();
  }

  /** Обновление позиции */
  update(dt: number): boolean {
    if (!this.active) return false;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt;

    if (this.age >= this.lifetime) {
      this.active = false;
      return false;
    }
    return true;
  }

  /** Деактивация после попадания */
  deactivate(): void {
    this.active = false;
  }
}
