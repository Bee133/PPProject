import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Crystal, QUADTREE_THRESHOLD } from '../types';
import { QuadTree } from '../utils/QuadTree';

/** Результат обработки коллизий за кадр */
export interface CollisionResult {
  killedEnemies: Enemy[];
  playerHit: boolean;
  collectedCrystals: Crystal[];
}

/**
 * Система коллизий через расстояние между окружностями (Math.hypot).
 * При >300 врагах использует QuadTree для оптимизации.
 */
export class CollisionSystem {
  private readonly quadTree: QuadTree<Enemy>;
  private readonly queryBuffer: Enemy[] = [];

  constructor(worldSize: number) {
    this.quadTree = new QuadTree<Enemy>({
      x: -worldSize / 2,
      y: -worldSize / 2,
      width: worldSize,
      height: worldSize,
    });
  }

  /** Проверка коллизии двух окружностей */
  static circlesOverlap(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number,
  ): boolean {
    return Math.hypot(x1 - x2, y1 - y2) < r1 + r2;
  }

  /** Обработка всех коллизий за кадр */
  process(
    player: Player,
    enemies: Enemy[],
    bullets: Bullet[],
    crystals: Crystal[],
    onBulletHit: (bullet: Bullet, enemy: Enemy, x: number, y: number) => void,
    onEnemyKilled: (enemy: Enemy) => void,
    onExplosion: (x: number, y: number, radius: number, damage: number, bullet: Bullet) => void,
  ): CollisionResult {
    const result: CollisionResult = {
      killedEnemies: [],
      playerHit: false,
      collectedCrystals: [],
    };

    // Коллизии пуль с врагами
    this.processBulletEnemyCollisions(enemies, bullets, onBulletHit, onExplosion, result, onEnemyKilled);

    // Коллизии игрока с врагами
    if (player.alive && player.invincibleTimer <= 0) {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (
          CollisionSystem.circlesOverlap(
            player.position.x,
            player.position.y,
            player.radius,
            enemy.x,
            enemy.y,
            enemy.radius,
          )
        ) {
          player.takeDamage(enemy.damage);
          result.playerHit = true;
          break;
        }
      }
    }

    // Сбор кристаллов опыта
    const pickupR = player.pickupRadius;
    for (let i = crystals.length - 1; i >= 0; i--) {
      const crystal = crystals[i];
      const dist = Math.hypot(crystal.x - player.position.x, crystal.y - player.position.y);
      if (dist < pickupR + crystal.radius) {
        result.collectedCrystals.push(crystal);
        crystals.splice(i, 1);
      }
    }

    return result;
  }

  /** Коллизии пуль — с QuadTree или линейным перебором */
  private processBulletEnemyCollisions(
    enemies: Enemy[],
    bullets: Bullet[],
    onBulletHit: (bullet: Bullet, enemy: Enemy, x: number, y: number) => void,
    onExplosion: (x: number, y: number, radius: number, damage: number, bullet: Bullet) => void,
    result: CollisionResult,
    onEnemyKilled: (enemy: Enemy) => void,
  ): void {
    const useQuadTree = enemies.length > QUADTREE_THRESHOLD;

    if (useQuadTree) {
      this.quadTree.clear();
      for (const enemy of enemies) {
        if (enemy.alive) this.quadTree.insert(enemy);
      }
    }

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      const targets = useQuadTree
        ? this.queryNearbyEnemies(bullet.x, bullet.y, bullet.radius + 30)
        : enemies.filter((e) => e.alive);

      for (const enemy of targets) {
        if (!enemy.alive) continue;
        if (bullet.hitIds.has(enemy.id)) continue;

        if (
          CollisionSystem.circlesOverlap(
            bullet.x,
            bullet.y,
            bullet.radius,
            enemy.x,
            enemy.y,
            enemy.radius,
          )
        ) {
          // Ракета — взрыв по области
          if (bullet.explosionRadius > 0) {
            onExplosion(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage, bullet);
            bullet.deactivate();
            break;
          }

          onBulletHit(bullet, enemy, bullet.x, bullet.y);

          if (enemy.takeDamage(bullet.damage)) {
            result.killedEnemies.push(enemy);
            onEnemyKilled(enemy);
          }

          bullet.hitIds.add(enemy.id);

          if (bullet.pierce <= 0) {
            bullet.deactivate();
            break;
          }
          bullet.pierce--;
        }
      }
    }
  }

  /** Поиск врагов рядом с пулей через QuadTree */
  private queryNearbyEnemies(x: number, y: number, radius: number): Enemy[] {
    this.queryBuffer.length = 0;
    this.quadTree.queryRadius(x, y, radius, this.queryBuffer);
    return this.queryBuffer;
  }

  /** Обработка взрыва ракеты — урон всем врагам в радиусе */
  processExplosion(
    x: number,
    y: number,
    radius: number,
    damage: number,
    enemies: Enemy[],
    onEnemyKilled: (enemy: Enemy) => void,
  ): Enemy[] {
    const killed: Enemy[] = [];
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist < radius + enemy.radius) {
        const falloff = 1 - dist / (radius + enemy.radius);
        if (enemy.takeDamage(Math.floor(damage * falloff))) {
          killed.push(enemy);
          onEnemyKilled(enemy);
        }
      }
    }
    return killed;
  }
}
