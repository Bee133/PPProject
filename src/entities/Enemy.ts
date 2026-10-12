import { Random } from '../utils/Random';

/** Тип врага для разнообразия */
export type EnemyKind = 'normal' | 'fast' | 'tank' | 'elite';

/**
 * Враг — преследует игрока, имеет HP, размер и скорость.
 * Элитные враги крупнее, прочнее и быстрее.
 */
/** Глобальный счётчик ID врагов */
let enemyIdCounter = 0;

export class Enemy {
  /** Уникальный ID для отслеживания попаданий пуль */
  id = 0;
  x = 0;
  y = 0;
  radius = 12;
  hp = 20;
  maxHp = 20;
  speed = 80;
  damage = 10;
  kind: EnemyKind = 'normal';
  color = '#ff4466';
  glowColor = '#ff6688';
  alive = true;
  /** Время жизни для анимации */
  pulsePhase = 0;
  /** Множитель сложности от системы спавна */
  difficultyScale = 1;

  /** Конфигурация по типу врага */
  static create(kind: EnemyKind, x: number, y: number, scale: number): Enemy {
    const enemy = new Enemy();
    enemy.id = ++enemyIdCounter;
    enemy.x = x;
    enemy.y = y;
    enemy.difficultyScale = scale;
    enemy.pulsePhase = Random.range(0, Math.PI * 2);

    switch (kind) {
      case 'fast':
        enemy.radius = 10;
        enemy.hp = 12;
        enemy.speed = 140;
        enemy.damage = 8;
        enemy.color = '#ffaa00';
        enemy.glowColor = '#ffcc44';
        break;
      case 'tank':
        enemy.radius = 20;
        enemy.hp = 60;
        enemy.speed = 50;
        enemy.damage = 20;
        enemy.color = '#aa2244';
        enemy.glowColor = '#cc3366';
        break;
      case 'elite':
        enemy.radius = 24;
        enemy.hp = 120;
        enemy.speed = 100;
        enemy.damage = 25;
        enemy.color = '#ff00ff';
        enemy.glowColor = '#ff66ff';
        break;
      default:
        enemy.radius = 12;
        enemy.hp = 20;
        enemy.speed = 80;
        enemy.damage = 10;
        enemy.color = '#ff4466';
        enemy.glowColor = '#ff6688';
    }

    // Масштабирование от сложности
    enemy.hp = Math.floor(enemy.hp * scale);
    enemy.maxHp = enemy.hp;
    enemy.speed *= 1 + (scale - 1) * 0.3;
    enemy.damage = Math.floor(enemy.damage * scale);
    enemy.kind = kind;

    return enemy;
  }

  /** Случайный тип врага с учётом вероятности элиты */
  static randomKind(eliteChance: number): EnemyKind {
    if (Random.chance(eliteChance)) return 'elite';
    const roll = Random.range(0, 1);
    if (roll < 0.15) return 'tank';
    if (roll < 0.35) return 'fast';
    return 'normal';
  }

  /** Движение к цели (игроку) */
  update(targetX: number, targetY: number, dt: number): void {
    if (!this.alive) return;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }

    this.pulsePhase += dt * 4;
  }

  /** Получение урона, возвращает true если убит */
  takeDamage(amount: number): boolean {
    if (!this.alive) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  /** Опыт за убийство */
  get xpValue(): number {
    switch (this.kind) {
      case 'elite': return 15;
      case 'tank': return 8;
      case 'fast': return 4;
      default: return 3;
    }
  }
}
