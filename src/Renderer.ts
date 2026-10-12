import { Camera } from './Camera';
import { Bullet } from './entities/Bullet';
import { Enemy } from './entities/Enemy';
import { Particle } from './entities/Particle';
import { Player } from './entities/Player';
import { Crystal } from './types';

/**
 * Рендерер — отвечает только за отрисовку через Canvas API.
 * Логика игры отделена от визуализации (SOLID — Single Responsibility).
 */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.canvas = canvas;
  }

  /** Изменение размера canvas */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /** Полная отрисовка кадра */
  render(
    camera: Camera,
    player: Player,
    enemies: Enemy[],
    bullets: Bullet[],
    particles: Particle[],
    crystals: Crystal[],
    gameTime: number,
  ): void {
    const { ctx } = this;
    const w = camera.width;
    const h = camera.height;

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    this.drawGrid(camera, gameTime);

    for (const crystal of crystals) {
      this.drawCrystal(camera, crystal);
    }

    this.drawTrail(camera, player);

    for (const enemy of enemies) {
      if (enemy.alive) this.drawEnemy(camera, enemy);
    }

    for (const bullet of bullets) {
      if (bullet.active) this.drawBullet(camera, bullet);
    }

    for (const particle of particles) {
      if (particle.active) this.drawParticle(camera, particle);
    }

    if (player.alive) this.drawPlayer(camera, player);

    this.drawVignette(w, h);
  }

  /** Отрисовка игрока с glow-эффектом */
  private drawPlayer(camera: Camera, player: Player): void {
    const { ctx } = this;
    const screen = camera.worldToScreen(player.position.x, player.position.y);
    const pulse = 1 + Math.sin(player.pulsePhase) * 0.08;

    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, player.radius * pulse + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const gradient = ctx.createRadialGradient(
      screen.x,
      screen.y,
      0,
      screen.x,
      screen.y,
      player.radius * pulse,
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#00f0ff');
    gradient.addColorStop(1, '#0088aa');

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, player.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, player.pickupRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /** След за игроком */
  private drawTrail(camera: Camera, player: Player): void {
    const { ctx } = this;
    for (const point of player.trail) {
      const screen = camera.worldToScreen(point.x, point.y);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, player.radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${point.alpha * 0.3})`;
      ctx.fill();
    }
  }

  /** Отрисовка врага */
  private drawEnemy(camera: Camera, enemy: Enemy): void {
    const { ctx } = this;
    const screen = camera.worldToScreen(enemy.x, enemy.y);
    const pulse = 1 + Math.sin(enemy.pulsePhase) * 0.05;

    ctx.save();
    ctx.shadowBlur = enemy.kind === 'elite' ? 25 : 12;
    ctx.shadowColor = enemy.glowColor;

    const gradient = ctx.createRadialGradient(
      screen.x,
      screen.y,
      0,
      screen.x,
      screen.y,
      enemy.radius * pulse,
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, enemy.color);
    gradient.addColorStop(1, `${enemy.color}88`);

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, enemy.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    if (enemy.kind === 'elite' || enemy.kind === 'tank') {
      const barW = enemy.radius * 2;
      const barH = 4;
      const hpRatio = enemy.hp / enemy.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(screen.x - barW / 2, screen.y - enemy.radius - 10, barW, barH);
      ctx.fillStyle = enemy.glowColor;
      ctx.fillRect(screen.x - barW / 2, screen.y - enemy.radius - 10, barW * hpRatio, barH);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /** Отрисовка пули */
  private drawBullet(camera: Camera, bullet: Bullet): void {
    const { ctx } = this;
    const screen = camera.worldToScreen(bullet.x, bullet.y);

    ctx.save();
    ctx.shadowBlur = bullet.weaponType === 'laser' ? 15 : 8;
    ctx.shadowColor = bullet.glowColor;

    if (bullet.weaponType === 'laser') {
      const angle = Math.atan2(bullet.vy, bullet.vx);
      ctx.translate(screen.x, screen.y);
      ctx.rotate(angle);
      ctx.fillStyle = bullet.color;
      ctx.fillRect(-8, -bullet.radius, 16, bullet.radius * 2);
    } else if (bullet.weaponType === 'rocket') {
      const angle = Math.atan2(bullet.vy, bullet.vx);
      ctx.translate(screen.x, screen.y);
      ctx.rotate(angle);
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, bullet.radius, 0, Math.PI * 2);
      ctx.fillStyle = bullet.color;
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /** Отрисовка частицы с плавным исчезновением */
  private drawParticle(camera: Camera, particle: Particle): void {
    const { ctx } = this;
    const screen = camera.worldToScreen(particle.x, particle.y);

    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.shadowBlur = 6;
    ctx.shadowColor = particle.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, particle.radius * particle.alpha, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.restore();
  }

  /** Кристалл опыта */
  private drawCrystal(camera: Camera, crystal: Crystal): void {
    const { ctx } = this;
    const screen = camera.worldToScreen(crystal.x, crystal.y);
    const pulse = 1 + Math.sin(crystal.pulsePhase) * 0.2;

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = crystal.color;

    ctx.translate(screen.x, screen.y);
    ctx.rotate(crystal.pulsePhase);
    ctx.fillStyle = crystal.color;
    ctx.beginPath();
    ctx.moveTo(0, -crystal.radius * pulse);
    ctx.lineTo(crystal.radius * pulse * 0.6, 0);
    ctx.lineTo(0, crystal.radius * pulse);
    ctx.lineTo(-crystal.radius * pulse * 0.6, 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /** Фоновая неоновая сетка */
  private drawGrid(camera: Camera, gameTime: number): void {
    const { ctx } = this;
    const gridSize = 60;
    const offsetX = (-camera.position.x + camera.width / 2) % gridSize;
    const offsetY = (-camera.position.y + camera.height / 2) % gridSize;

    ctx.strokeStyle = 'rgba(30, 30, 60, 0.5)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < camera.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, camera.height);
      ctx.stroke();
    }
    for (let y = offsetY; y < camera.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(camera.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(0, 240, 255, ${0.03 + Math.sin(gameTime) * 0.01})`;
    ctx.lineWidth = 0.5;
    const accentSpacing = gridSize * 5;
    const accentOffsetX = (-camera.position.x + camera.width / 2) % accentSpacing;
    const accentOffsetY = (-camera.position.y + camera.height / 2) % accentSpacing;

    for (let x = accentOffsetX; x < camera.width; x += accentSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, camera.height);
      ctx.stroke();
    }
    for (let y = accentOffsetY; y < camera.height; y += accentSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(camera.width, y);
      ctx.stroke();
    }
  }

  /** Виньетка по краям экрана */
  private drawVignette(w: number, h: number): void {
    const { ctx } = this;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
