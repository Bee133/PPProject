import { Vector } from '../math/Vector';
import {
  BASE_PICKUP_RADIUS,
  BASE_XP_TO_LEVEL,
  DEFAULT_MODIFIERS,
  PlayerModifiers,
  WeaponType,
  XP_LEVEL_MULTIPLIER,
} from '../types';

/** Точка следа за игроком для визуального эффекта */
export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

/**
 * Игрок — управляемая сущность с HP, опытом, уровнем и модификаторами.
 * Движение реализовано через плавное ускорение и ограничение скорости.
 */
export class Player {
  readonly position = new Vector();
  readonly velocity = new Vector();
  readonly trail: TrailPoint[] = [];

  /** Базовые характеристики */
  maxHp = 100;
  hp = 100;
  xp = 0;
  level = 1;
  xpToNextLevel = BASE_XP_TO_LEVEL;

  /** Параметры движения */
  readonly baseSpeed = 220;
  readonly acceleration = 900;
  readonly friction = 6;
  readonly radius = 14;

  /** Текущее оружие и модификаторы от улучшений */
  weapon: WeaponType = 'pistol';
  modifiers: PlayerModifiers = { ...DEFAULT_MODIFIERS };

  /** Время неуязвимости после получения урона */
  invincibleTimer = 0;

  /** Визуальная пульсация */
  pulsePhase = 0;

  /** Активен ли игрок (не мёртв) */
  alive = true;

  /** Эффективная максимальная скорость с учётом улучшений */
  get maxSpeed(): number {
    return this.baseSpeed * this.modifiers.speedMultiplier;
  }

  /** Радиус сбора кристаллов */
  get pickupRadius(): number {
    return BASE_PICKUP_RADIUS * this.modifiers.pickupRadiusMultiplier;
  }

  /** Обновление движения с плавным ускорением */
  update(inputX: number, inputY: number, dt: number): void {
    if (!this.alive) return;

    // Направление ввода (нормализованное)
    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 0) {
      const dirX = inputX / inputLen;
      const dirY = inputY / inputLen;
      this.velocity.x += dirX * this.acceleration * dt;
      this.velocity.y += dirY * this.acceleration * dt;
    }

    // Трение — плавное замедление
    const frictionFactor = Math.exp(-this.friction * dt);
    this.velocity.x *= frictionFactor;
    this.velocity.y *= frictionFactor;

    // Ограничение максимальной скорости
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    const maxSpd = this.maxSpeed;
    if (speed > maxSpd) {
      const scale = maxSpd / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }

    // Применение скорости к позиции
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Обновление следа
    this.updateTrail(dt);

    // Таймер неуязвимости
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    this.pulsePhase += dt * 3;
  }

  /** Добавление опыта и проверка повышения уровня */
  addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level++;
      this.xpToNextLevel = Math.floor(BASE_XP_TO_LEVEL * Math.pow(XP_LEVEL_MULTIPLIER, this.level - 1));
      return true;
    }
    return false;
  }

  /** Получение урона */
  takeDamage(amount: number): boolean {
    if (this.invincibleTimer > 0 || !this.alive) return false;

    this.hp -= amount;
    this.invincibleTimer = 0.5;

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  /** Лечение */
  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** Сброс игрока при новой игре */
  reset(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.maxHp = 100;
    this.hp = 100;
    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = BASE_XP_TO_LEVEL;
    this.weapon = 'pistol';
    this.modifiers = { ...DEFAULT_MODIFIERS };
    this.invincibleTimer = 0;
    this.alive = true;
    this.trail.length = 0;
    this.pulsePhase = 0;
  }

  /** Обновление следа — точки постепенно исчезают */
  private updateTrail(dt: number): void {
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    if (speed > 30) {
      this.trail.push({ x: this.position.x, y: this.position.y, alpha: 0.6 });
    }

    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].alpha -= dt * 2;
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Ограничение длины следа
    while (this.trail.length > 20) {
      this.trail.shift();
    }
  }
}
