import { Player } from '../entities/Player';
import { WEAPON_CONFIGS } from '../types';

/**
 * HUD — отображение игровой информации поверх canvas.
 * HP, опыт, уровень, FPS, количество врагов, оружие.
 */
export class HUD {
  private fps = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  /** Обновление счётчика FPS */
  update(dt: number): void {
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  /** Отрисовка HUD */
  render(
    ctx: CanvasRenderingContext2D,
    player: Player,
    enemyCount: number,
    gameTime: number,
    width: number,
  ): void {
    const padding = 20;
    const barWidth = 220;
    const barHeight = 14;

    ctx.save();
    ctx.font = '14px "Segoe UI", system-ui, sans-serif';

    // HP bar
    this.drawBar(
      ctx,
      padding,
      padding,
      barWidth,
      barHeight,
      player.hp / player.maxHp,
      '#ff3366',
      '#ff6688',
      `HP ${Math.ceil(player.hp)}/${player.maxHp}`,
    );

    // XP bar
    const xpRatio = player.xp / player.xpToNextLevel;
    this.drawBar(
      ctx,
      padding,
      padding + 28,
      barWidth,
      barHeight,
      xpRatio,
      '#00f0ff',
      '#00ccdd',
      `LVL ${player.level}  XP ${Math.floor(player.xp)}/${player.xpToNextLevel}`,
    );

    // Информационная панель справа
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const infoX = width - padding;

    ctx.fillText(`FPS: ${this.fps}`, infoX, padding + 12);
    ctx.fillText(`Враги: ${enemyCount}`, infoX, padding + 32);
    ctx.fillText(`Время: ${this.formatTime(gameTime)}`, infoX, padding + 52);

    const weaponName = WEAPON_CONFIGS[player.weapon].name;
    ctx.fillStyle = WEAPON_CONFIGS[player.weapon].color;
    ctx.fillText(`⚔ ${weaponName}`, infoX, padding + 72);

    ctx.restore();
  }

  /** Универсальная полоска прогресса с glow */
  private drawBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    ratio: number,
    color: string,
    glowColor: string,
    label: string,
  ): void {
    // Фон
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    // Заполнение
    if (ratio > 0) {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = glowColor;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w * Math.min(ratio, 1), h, 4);
      ctx.fill();
      ctx.restore();
    }

    // Рамка
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.stroke();

    // Текст
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(label, x + 8, y + h - 3);
  }

  /** Форматирование времени mm:ss */
  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
