import { Random } from '../utils/Random';

/** Тип частицы для разных визуальных эффектов */
export type ParticleType = 'death' | 'hit' | 'levelUp' | 'muzzle' | 'explosion';

/**
 * Частица — визуальный эффект с плавным исчезновением.
 * Использует Object Pool для минимизации аллокаций.
 */
export class Particle {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  radius = 3;
  color = '#ffffff';
  alpha = 1;
  lifetime = 0.5;
  age = 0;
  active = false;
  type: ParticleType = 'hit';
  /** Замедление частицы */
  drag = 3;

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 3;
    this.color = '#ffffff';
    this.alpha = 1;
    this.lifetime = 0.5;
    this.age = 0;
    this.active = false;
    this.type = 'hit';
    this.drag = 3;
  }

  init(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    color: string,
    lifetime: number,
    type: ParticleType,
  ): void {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.alpha = 1;
    this.active = true;
    this.type = type;
  }

  /** Обновление — движение и затухание */
  update(dt: number): boolean {
    if (!this.active) return false;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Замедление
    const dragFactor = Math.exp(-this.drag * dt);
    this.vx *= dragFactor;
    this.vy *= dragFactor;

    this.age += dt;
    this.alpha = 1 - this.age / this.lifetime;

    if (this.age >= this.lifetime) {
      this.active = false;
      return false;
    }
    return true;
  }
}

/** Фабрика для создания набора частиц при событии */
export class ParticleEmitter {
  /** Частицы при смерти врага */
  static deathBurst(
    pool: { acquire: () => Particle; release: (p: Particle) => void },
    active: Particle[],
    x: number,
    y: number,
    color: string,
    count = 12,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = pool.acquire();
      const angle = Random.angle();
      const speed = Random.range(80, 200);
      p.init(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Random.range(2, 5),
        color,
        Random.range(0.3, 0.7),
        'death',
      );
      active.push(p);
    }
  }

  /** Частицы при попадании */
  static hitSpark(
    pool: { acquire: () => Particle; release: (p: Particle) => void },
    active: Particle[],
    x: number,
    y: number,
    color: string,
    count = 5,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = pool.acquire();
      const angle = Random.angle();
      const speed = Random.range(60, 150);
      p.init(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Random.range(1.5, 3),
        color,
        Random.range(0.15, 0.35),
        'hit',
      );
      active.push(p);
    }
  }

  /** Частицы при повышении уровня */
  static levelUpBurst(
    pool: { acquire: () => Particle; release: (p: Particle) => void },
    active: Particle[],
    x: number,
    y: number,
    count = 30,
  ): void {
    const colors = ['#00f0ff', '#b537ff', '#ff00ff', '#00ff88', '#ffcc00'];
    for (let i = 0; i < count; i++) {
      const p = pool.acquire();
      const angle = Random.angle();
      const speed = Random.range(100, 280);
      p.init(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Random.range(2, 6),
        Random.pick(colors),
        Random.range(0.5, 1.2),
        'levelUp',
      );
      p.drag = 2;
      active.push(p);
    }
  }

  /** Вспышка при выстреле */
  static muzzleFlash(
    pool: { acquire: () => Particle; release: (p: Particle) => void },
    active: Particle[],
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    color: string,
  ): void {
    for (let i = 0; i < 4; i++) {
      const p = pool.acquire();
      const spread = Random.range(-0.3, 0.3);
      const cos = Math.cos(spread);
      const sin = Math.sin(spread);
      const vx = (dirX * cos - dirY * sin) * Random.range(100, 200);
      const vy = (dirX * sin + dirY * cos) * Random.range(100, 200);
      p.init(x, y, vx, vy, Random.range(2, 4), color, 0.12, 'muzzle');
      active.push(p);
    }
  }

  /** Взрыв ракеты */
  static explosion(
    pool: { acquire: () => Particle; release: (p: Particle) => void },
    active: Particle[],
    x: number,
    y: number,
    count = 20,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = pool.acquire();
      const angle = Random.angle();
      const speed = Random.range(120, 350);
      p.init(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Random.range(3, 7),
        Random.chance(0.5) ? '#ff3366' : '#ffaa00',
        Random.range(0.3, 0.6),
        'explosion',
      );
      active.push(p);
    }
  }
}
