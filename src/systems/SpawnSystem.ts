import { Enemy } from '../entities/Enemy';
import { Random } from '../utils/Random';

/** Контекст для спавна — позиция игрока и границы видимой области */
export interface SpawnContext {
  playerX: number;
  playerY: number;
  cameraX: number;
  cameraY: number;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Система спавна врагов.
 * Со временем увеличивает количество, скорость и HP врагов.
 */
export class SpawnSystem {
  /** Интервал между волнами спавна (секунды) */
  spawnInterval = 2.5;
  spawnTimer = 0;

  /** Базовое количество врагов за волну */
  baseSpawnCount = 3;

  /** Множитель сложности (растёт со временем) */
  difficultyScale = 1;

  /** Время игры для эскалации */
  gameTime = 0;

  /** Вероятность элитного врага */
  eliteChance = 0.05;

  /** Минимальное расстояние спавна от игрока */
  readonly minSpawnDistance = 500;

  /** Обновление таймеров и эскалации сложности */
  update(dt: number): void {
    this.gameTime += dt;
    this.spawnTimer -= dt;

    // Каждые 15 секунд увеличиваем сложность
    const difficultyLevel = Math.floor(this.gameTime / 15);
    this.difficultyScale = 1 + difficultyLevel * 0.15;
    this.baseSpawnCount = 3 + difficultyLevel;
    this.spawnInterval = Math.max(0.8, 2.5 - difficultyLevel * 0.12);
    this.eliteChance = Math.min(0.25, 0.05 + difficultyLevel * 0.02);
  }

  /** Нужно ли спавнить новую волну */
  shouldSpawn(): boolean {
    return this.spawnTimer <= 0;
  }

  /** Сброс таймера после спавна */
  resetTimer(): void {
    this.spawnTimer = this.spawnInterval;
  }

  /** Создание волны врагов за пределами экрана */
  spawnWave(context: SpawnContext): Enemy[] {
    const count = this.baseSpawnCount + Random.int(0, 2);
    const enemies: Enemy[] = [];

    for (let i = 0; i < count; i++) {
      const pos = this.getSpawnPosition(context);
      const kind = Enemy.randomKind(this.eliteChance);
      enemies.push(Enemy.create(kind, pos.x, pos.y, this.difficultyScale));
    }

    return enemies;
  }

  /** Позиция спавна за пределами видимой области экрана */
  private getSpawnPosition(ctx: SpawnContext): { x: number; y: number } {
    const margin = 80;
    const halfW = ctx.screenWidth / 2 + margin;
    const halfH = ctx.screenHeight / 2 + margin;

    // Случайная сторона экрана: 0=верх, 1=право, 2=низ, 3=лево
    const side = Random.int(0, 3);
    let x: number;
    let y: number;

    switch (side) {
      case 0:
        x = ctx.cameraX + Random.range(-halfW, halfW);
        y = ctx.cameraY - halfH - Random.range(50, 150);
        break;
      case 1:
        x = ctx.cameraX + halfW + Random.range(50, 150);
        y = ctx.cameraY + Random.range(-halfH, halfH);
        break;
      case 2:
        x = ctx.cameraX + Random.range(-halfW, halfW);
        y = ctx.cameraY + halfH + Random.range(50, 150);
        break;
      default:
        x = ctx.cameraX - halfW - Random.range(50, 150);
        y = ctx.cameraY + Random.range(-halfH, halfH);
    }

    // Гарантируем минимальное расстояние от игрока
    const dx = x - ctx.playerX;
    const dy = y - ctx.playerY;
    const dist = Math.hypot(dx, dy);
    if (dist < this.minSpawnDistance) {
      const scale = this.minSpawnDistance / dist;
      x = ctx.playerX + dx * scale;
      y = ctx.playerY + dy * scale;
    }

    return { x, y };
  }

  /** Сброс при новой игре */
  reset(): void {
    this.spawnInterval = 2.5;
    this.spawnTimer = 1;
    this.baseSpawnCount = 3;
    this.difficultyScale = 1;
    this.gameTime = 0;
    this.eliteChance = 0.05;
  }
}
