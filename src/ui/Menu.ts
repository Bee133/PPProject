import { GameState, UpgradeOption } from '../types';

/** Колбэк выбора улучшения */
export type UpgradeSelectCallback = (index: number) => void;

/** Колбэк начала игры */
export type StartGameCallback = () => void;

/**
 * Меню — главное меню, экран level-up и game over.
 * Обрабатывает клики мыши для выбора улучшений.
 */
export class Menu {
  private hoveredUpgrade = -1;
  private readonly canvas: HTMLCanvasElement;
  private onUpgradeSelect: UpgradeSelectCallback | null = null;
  private onStartGame: StartGameCallback | null = null;
  private mouseX = 0;
  private mouseY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('click', this.onClick);
  }

  setUpgradeHandler(callback: UpgradeSelectCallback): void {
    this.onUpgradeSelect = callback;
  }

  setStartHandler(callback: StartGameCallback): void {
    this.onStartGame = callback;
  }

  render(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    width: number,
    height: number,
    upgrades: UpgradeOption[] = [],
    stats?: { level: number; time: number; kills: number },
  ): void {
    switch (state) {
      case 'menu':
        this.renderMainMenu(ctx, width, height);
        break;
      case 'levelUp':
        this.renderLevelUp(ctx, width, height, upgrades);
        break;
      case 'gameOver':
        this.renderGameOver(ctx, width, height, stats);
        break;
    }
  }

  private renderMainMenu(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 48px "Segoe UI", system-ui, sans-serif';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('ARENA SURVIVOR', w / 2, h / 2 - 80);

    ctx.shadowBlur = 0;
    ctx.font = '18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Top-Down Neon Survival', w / 2, h / 2 - 40);

    const btnW = 240;
    const btnH = 50;
    const btnX = w / 2 - btnW / 2;
    const btnY = h / 2 + 20;
    const hovered = this.isInButton(btnX, btnY, btnW, btnH);

    ctx.fillStyle = hovered ? '#00f0ff' : 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = hovered ? '#0a0a12' : '#00f0ff';
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('НАЧАТЬ ИГРУ', w / 2, btnY + 33);

    ctx.font = '14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('WASD — движение  |  Автоматическая стрельба', w / 2, h - 60);

    ctx.restore();
  }

  private renderLevelUp(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    upgrades: UpgradeOption[],
  ): void {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#b537ff';
    ctx.fillStyle = '#b537ff';
    ctx.fillText('LEVEL UP!', w / 2, h / 2 - 160);
    ctx.shadowBlur = 0;

    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Выберите улучшение', w / 2, h / 2 - 120);

    const cardW = 200;
    const cardH = 140;
    const gap = 24;
    const totalW = upgrades.length * cardW + (upgrades.length - 1) * gap;
    const startX = w / 2 - totalW / 2;
    const cardY = h / 2 - 40;

    upgrades.forEach((upgrade, i) => {
      const x = startX + i * (cardW + gap);
      const hovered = this.hoveredUpgrade === i;

      ctx.fillStyle = hovered ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.roundRect(x, cardY, cardW, cardH, 10);
      ctx.fill();

      ctx.strokeStyle = hovered ? '#00f0ff' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = hovered ? 2 : 1;
      ctx.stroke();

      if (hovered) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f0ff';
      }

      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'left';
      ctx.fillText(`[${i + 1}]`, x + 12, cardY + 24);

      ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = hovered ? '#00f0ff' : '#ffffff';
      ctx.fillText(upgrade.title, x + 12, cardY + 55);

      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      this.wrapText(ctx, upgrade.description, x + 12, cardY + 80, cardW - 24, 18);

      ctx.shadowBlur = 0;
    });

    ctx.textAlign = 'center';
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Кликните или нажмите 1, 2, 3', w / 2, cardY + cardH + 40);

    ctx.restore();
  }

  private renderGameOver(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    stats?: { level: number; time: number; kills: number },
  ): void {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 42px "Segoe UI", system-ui, sans-serif';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff3366';
    ctx.fillStyle = '#ff3366';
    ctx.fillText('GAME OVER', w / 2, h / 2 - 80);
    ctx.shadowBlur = 0;

    if (stats) {
      ctx.font = '18px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`Уровень: ${stats.level}`, w / 2, h / 2 - 20);
      ctx.fillText(`Время: ${Math.floor(stats.time)}с`, w / 2, h / 2 + 10);
      ctx.fillText(`Убийств: ${stats.kills}`, w / 2, h / 2 + 40);
    }

    const btnW = 240;
    const btnH = 50;
    const btnX = w / 2 - btnW / 2;
    const btnY = h / 2 + 80;
    const hovered = this.isInButton(btnX, btnY, btnW, btnH);

    ctx.fillStyle = hovered ? '#ff3366' : 'rgba(255, 51, 102, 0.2)';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = hovered ? '#ffffff' : '#ff3366';
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('ИГРАТЬ СНОВА', w / 2, btnY + 33);

    ctx.restore();
  }

  private isInButton(bx: number, by: number, bw: number, bh: number): boolean {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (this.mouseX - rect.left) * scaleX;
    const my = (this.mouseY - rect.top) * scaleY;
    return mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;
  }

  private readonly onMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    this.hoveredUpgrade = -1;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cardW = 200;
    const gap = 24;
    const totalW = 3 * cardW + 2 * gap;
    const startX = w / 2 - totalW / 2;
    const cardY = h / 2 - 40;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (cardW + gap);
      if (mx >= x && mx <= x + cardW && my >= cardY && my <= cardY + 140) {
        this.hoveredUpgrade = i;
      }
    }
  };

  private readonly onClick = (): void => {
    // Обработка кликов делегируется в Game.handleClick
  };

  handleClick(state: GameState, width: number, height: number, upgradeCount: number): string | number {
    if (state === 'menu') {
      const btnW = 240;
      const btnH = 50;
      const btnX = width / 2 - btnW / 2;
      const btnY = height / 2 + 20;
      if (this.isInButton(btnX, btnY, btnW, btnH)) {
        this.onStartGame?.();
        return 'start';
      }
    }

    if (state === 'levelUp') {
      const cardW = 200;
      const gap = 24;
      const totalW = upgradeCount * cardW + (upgradeCount - 1) * gap;
      const startX = width / 2 - totalW / 2;
      const cardY = height / 2 - 40;

      for (let i = 0; i < upgradeCount; i++) {
        const x = startX + i * (cardW + gap);
        if (this.isInButton(x, cardY, cardW, 140)) {
          this.onUpgradeSelect?.(i);
          return i;
        }
      }
    }

    if (state === 'gameOver') {
      const btnW = 240;
      const btnH = 50;
      const btnX = width / 2 - btnW / 2;
      const btnY = height / 2 + 80;
      if (this.isInButton(btnX, btnY, btnW, btnH)) {
        this.onStartGame?.();
        return 'restart';
      }
    }

    return 'none';
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line !== '') {
        ctx.fillText(line, x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  destroy(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('click', this.onClick);
  }
}
