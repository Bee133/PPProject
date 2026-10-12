import { Camera } from './Camera';
import { Input } from './Input';
import { Renderer } from './Renderer';
import { Enemy } from './entities/Enemy';
import { Particle, ParticleEmitter } from './entities/Particle';
import { Player } from './entities/Player';
import { CollisionSystem } from './systems/CollisionSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { UpgradeSystem } from './systems/UpgradeSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { HUD } from './ui/HUD';
import { Menu } from './ui/Menu';
import { Crystal, GameState, UpgradeOption, WORLD_SIZE } from './types';
import { ObjectPool } from './utils/ObjectPool';
import { Random } from './utils/Random';

/**
 * Game — центральный класс, координирующий все системы.
 * Игровой цикл через requestAnimationFrame с delta time.
 */
export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly input: Input;
  private readonly camera: Camera;
  private readonly player: Player;
  private readonly hud: HUD;
  private readonly menu: Menu;

  /** Игровые системы */
  private readonly spawnSystem: SpawnSystem;
  private readonly collisionSystem: CollisionSystem;
  private readonly upgradeSystem: UpgradeSystem;
  private readonly weaponSystem: WeaponSystem;

  /** Пул частиц */
  private readonly particlePool: ObjectPool<Particle>;
  private readonly activeParticles: Particle[] = [];

  /** Игровые коллекции */
  private readonly enemies: Enemy[] = [];
  private readonly crystals: Crystal[] = [];

  /** Состояние игры */
  private state: GameState = 'menu';
  private gameTime = 0;
  private killCount = 0;
  private upgradeOptions: UpgradeOption[] = [];

  /** Игровой цикл */
  private lastTime = 0;
  private animationId = 0;
  private running = false;

  /** Цвета кристаллов опыта */
  private readonly crystalColors = ['#00f0ff', '#b537ff', '#00ff88', '#ffcc00'];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.camera = new Camera();
    this.player = new Player();
    this.hud = new HUD();
    this.menu = new Menu(canvas);

    this.spawnSystem = new SpawnSystem();
    this.collisionSystem = new CollisionSystem(WORLD_SIZE);
    this.upgradeSystem = new UpgradeSystem();
    this.weaponSystem = new WeaponSystem();

    this.particlePool = new ObjectPool<Particle>(
      () => new Particle(),
      (p) => p.reset(),
      256,
    );

    this.setupEventHandlers();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  /** Запуск игрового цикла */
  start(): void {
    this.input.attach();
    this.running = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  /** Остановка игры */
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    this.input.detach();
    window.removeEventListener('resize', this.handleResize);
    this.menu.destroy();
  }

  /** Настройка обработчиков UI */
  private setupEventHandlers(): void {
    this.menu.setStartHandler(() => this.startGame());
    this.menu.setUpgradeHandler((index) => this.selectUpgrade(index));

    this.canvas.addEventListener('click', () => {
      this.menu.handleClick(
        this.state,
        this.camera.width,
        this.camera.height,
        this.upgradeOptions.length,
      );
    });
  }

  /** Начало новой игры */
  private startGame(): void {
    this.player.reset(0, 0);
    this.enemies.length = 0;
    this.crystals.length = 0;
    this.clearParticles();
    this.weaponSystem.reset();
    this.spawnSystem.reset();
    this.gameTime = 0;
    this.killCount = 0;
    this.state = 'playing';
    this.camera.snapTo(0, 0);
  }

  /** Основной игровой цикл */
  private readonly gameLoop = (timestamp: number): void => {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.input.update();
    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  /** Обновление логики */
  private update(dt: number): void {
    // Горячие клавиши для level-up
    if (this.state === 'levelUp') {
      if (this.input.isPressed('Digit1')) this.selectUpgrade(0);
      if (this.input.isPressed('Digit2')) this.selectUpgrade(1);
      if (this.input.isPressed('Digit3')) this.selectUpgrade(2);
      return;
    }

    if (this.state === 'menu' || this.state === 'gameOver') {
      if (this.input.isPressed('Enter') || this.input.isPressed('Space')) {
        this.startGame();
      }
      return;
    }

    // === Игровая логика ===
    this.gameTime += dt;
    this.hud.update(dt);

    // Движение игрока
    const movement = this.input.getMovement();
    this.player.update(movement.x, movement.y, dt);

    // Камера следует за игроком
    this.camera.setTarget(this.player.position.x, this.player.position.y);
    this.camera.update(dt);

    // Спавн врагов
    this.spawnSystem.update(dt);
    if (this.spawnSystem.shouldSpawn()) {
      const wave = this.spawnSystem.spawnWave({
        playerX: this.player.position.x,
        playerY: this.player.position.y,
        cameraX: this.camera.position.x,
        cameraY: this.camera.position.y,
        screenWidth: this.camera.width,
        screenHeight: this.camera.height,
      });
      this.enemies.push(...wave);
      this.spawnSystem.resetTimer();
    }

    // Обновление врагов
    for (const enemy of this.enemies) {
      enemy.update(this.player.position.x, this.player.position.y, dt);
    }

    // Оружие и пули
    this.weaponSystem.update(
      dt,
      this.player,
      this.enemies,
      this.particlePool,
      this.activeParticles,
    );

    // Коллизии
    const collisionResult = this.collisionSystem.process(
      this.player,
      this.enemies,
      this.weaponSystem.activeBullets,
      this.crystals,
      (_bullet, _enemy, x, y) => {
        ParticleEmitter.hitSpark(this.particlePool, this.activeParticles, x, y, _bullet.color);
      },
      (enemy) => {
        this.onEnemyKilled(enemy);
      },
      (x, y, radius, damage, bullet) => {
        this.handleExplosion(x, y, radius, damage, bullet);
      },
    );

    if (collisionResult.playerHit) {
      this.camera.shake(8, 0.25);
    }

    // Сбор кристаллов
    for (const crystal of collisionResult.collectedCrystals) {
      if (this.player.addXp(crystal.value)) {
        this.triggerLevelUp();
      }
    }

    // Обновление кристаллов (пульсация)
    for (const crystal of this.crystals) {
      crystal.pulsePhase += dt * 3;
    }

    // Обновление частиц
    this.updateParticles(dt);

    // Очистка мёртвых врагов (периодически)
    this.cleanupDeadEnemies();

    // Проверка смерти игрока
    if (!this.player.alive) {
      this.state = 'gameOver';
    }
  }

  /** Обработка убийства врага */
  private onEnemyKilled(enemy: Enemy): void {
    this.killCount++;
    ParticleEmitter.deathBurst(
      this.particlePool,
      this.activeParticles,
      enemy.x,
      enemy.y,
      enemy.color,
      enemy.kind === 'elite' ? 20 : 12,
    );

    // Выпадение кристалла опыта
    this.crystals.push({
      x: enemy.x + Random.range(-10, 10),
      y: enemy.y + Random.range(-10, 10),
      radius: 6,
      value: enemy.xpValue,
      color: Random.pick(this.crystalColors),
      pulsePhase: Random.range(0, Math.PI * 2),
    });

    if (enemy.kind === 'elite') {
      this.camera.shake(5, 0.2);
    }
  }

  /** Взрыв ракеты */
  private handleExplosion(
    x: number,
    y: number,
    radius: number,
    damage: number,
    bullet: import('./entities/Bullet').Bullet,
  ): void {
    ParticleEmitter.explosion(this.particlePool, this.activeParticles, x, y, 25);
    this.camera.shake(12, 0.35);

    const killed = this.collisionSystem.processExplosion(
      x,
      y,
      radius,
      damage,
      this.enemies,
      (enemy) => this.onEnemyKilled(enemy),
    );

    bullet.deactivate();
    void killed;
  }

  /** Повышение уровня — пауза и выбор улучшения */
  private triggerLevelUp(): void {
    this.state = 'levelUp';
    this.upgradeOptions = this.upgradeSystem.generateOptions();
    ParticleEmitter.levelUpBurst(
      this.particlePool,
      this.activeParticles,
      this.player.position.x,
      this.player.position.y,
    );
    this.camera.shake(6, 0.3);
  }

  /** Выбор улучшения игроком */
  private selectUpgrade(index: number): void {
    if (this.state !== 'levelUp' || index >= this.upgradeOptions.length) return;

    const upgrade = this.upgradeOptions[index];
    this.upgradeSystem.applyUpgrade(this.player, upgrade.id);
    this.state = 'playing';
    this.upgradeOptions = [];
  }

  /** Обновление частиц и возврат в пул */
  private updateParticles(dt: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      if (!particle.update(dt)) {
        this.particlePool.release(particle);
        this.activeParticles.splice(i, 1);
      }
    }
  }

  /** Удаление мёртвых врагов из массива */
  private cleanupDeadEnemies(): void {
    if (this.enemies.length > 500) {
      let write = 0;
      for (let read = 0; read < this.enemies.length; read++) {
        if (this.enemies[read].alive) {
          this.enemies[write++] = this.enemies[read];
        }
      }
      this.enemies.length = write;
    }
  }

  /** Очистка всех частиц */
  private clearParticles(): void {
    for (const p of this.activeParticles) {
      this.particlePool.release(p);
    }
    this.activeParticles.length = 0;
  }

  /** Отрисовка */
  private render(): void {
    this.renderer.render(
      this.camera,
      this.player,
      this.enemies,
      this.weaponSystem.activeBullets,
      this.activeParticles,
      this.crystals,
      this.gameTime,
    );

    const ctx = this.renderer.getContext();

    if (this.state === 'playing') {
      const aliveEnemies = this.enemies.filter((e) => e.alive).length;
      this.hud.render(
        ctx,
        this.player,
        aliveEnemies,
        this.gameTime,
        this.camera.width,
      );
    }

    if (this.state !== 'playing') {
      this.menu.render(
        ctx,
        this.state,
        this.camera.width,
        this.camera.height,
        this.upgradeOptions,
        {
          level: this.player.level,
          time: this.gameTime,
          kills: this.killCount,
        },
      );
    }
  }

  /** Адаптивный размер canvas */
  private readonly handleResize = (): void => {
    const container = this.canvas.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    this.renderer.resize(width, height);
    this.camera.resize(width, height);
  };
}
