import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Particle, ParticleEmitter } from '../entities/Particle';
import { Player } from '../entities/Player';
import { Vector } from '../math/Vector';
import { WEAPON_CONFIGS, WeaponType } from '../types';
import { ObjectPool } from '../utils/ObjectPool';

/**
 * Система оружия — автоматическая стрельба в ближайшего врага.
 * Поддерживает пистолет, дробовик, лазер и ракету.
 */
export class WeaponSystem {
  private fireTimer = 0;
  private bulletIdCounter = 0;

  /** Пул пуль для переиспользования */
  readonly bulletPool: ObjectPool<Bullet>;
  /** Активные пули в игре */
  readonly activeBullets: Bullet[] = [];

  constructor() {
    this.bulletPool = new ObjectPool<Bullet>(
      () => new Bullet(),
      (b) => b.reset(),
      128,
    );
  }

  /** Обновление — стрельба и движение пуль */
  update(
    dt: number,
    player: Player,
    enemies: Enemy[],
    particlePool: { acquire: () => Particle; release: (p: Particle) => void },
    activeParticles: Particle[],
  ): void {
    // Автоматическая стрельба
    this.fireTimer -= dt;
    const config = WEAPON_CONFIGS[player.weapon];
    const fireInterval = 1 / (config.fireRate * player.modifiers.fireRateMultiplier);

    if (this.fireTimer <= 0 && player.alive) {
      const target = this.findNearestEnemy(player.position.x, player.position.y, enemies);
      if (target) {
        this.fire(player, target, config, particlePool, activeParticles);
        this.fireTimer = fireInterval;
      }
    }

    // Обновление активных пуль
    for (let i = this.activeBullets.length - 1; i >= 0; i--) {
      const bullet = this.activeBullets[i];
      if (!bullet.update(dt)) {
        this.bulletPool.release(bullet);
        this.activeBullets.splice(i, 1);
      }
    }
  }

  /** Поиск ближайшего живого врага */
  findNearestEnemy(px: number, py: number, enemies: Enemy[]): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - px, enemy.y - py);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  /** Выстрел — создаёт пули согласно конфигурации оружия */
  private fire(
    player: Player,
    target: Enemy,
    config: typeof WEAPON_CONFIGS[WeaponType],
    particlePool: { acquire: () => Particle; release: (p: Particle) => void },
    activeParticles: Particle[],
  ): void {
    const dx = target.x - player.position.x;
    const dy = target.y - player.position.y;
    const baseAngle = Math.atan2(dy, dx);

    const projectileCount = config.projectileCount + player.modifiers.extraProjectiles;
    const damage = Math.floor(config.damage * player.modifiers.damageMultiplier);
    const bulletSpeed = config.bulletSpeed * player.modifiers.bulletSpeedMultiplier;
    const pierce = config.pierce + player.modifiers.pierceBonus;
    const explosionRadius = config.type === 'rocket' ? 80 : 0;

    for (let i = 0; i < projectileCount; i++) {
      const spreadOffset =
        projectileCount > 1
          ? (i / (projectileCount - 1) - 0.5) * config.spread * 2
          : (Math.random() - 0.5) * config.spread;

      const angle = baseAngle + spreadOffset;
      const direction = Vector.fromAngle(angle);

      const bullet = this.bulletPool.acquire();
      bullet.init(
        player.position.x + direction.x * (player.radius + 5),
        player.position.y + direction.y * (player.radius + 5),
        direction,
        damage,
        bulletSpeed,
        config.bulletRadius,
        pierce,
        config.type,
        config.color,
        config.glowColor,
        this.bulletIdCounter++,
        explosionRadius,
      );
      this.activeBullets.push(bullet);
    }

    // Вспышка выстрела
    const dirX = Math.cos(baseAngle);
    const dirY = Math.sin(baseAngle);
    ParticleEmitter.muzzleFlash(
      particlePool,
      activeParticles,
      player.position.x + dirX * player.radius,
      player.position.y + dirY * player.radius,
      dirX,
      dirY,
      config.color,
    );
  }

  /** Очистка всех пуль (новая игра) */
  reset(): void {
    for (const bullet of this.activeBullets) {
      this.bulletPool.release(bullet);
    }
    this.activeBullets.length = 0;
    this.fireTimer = 0;
    this.bulletIdCounter = 0;
  }
}
