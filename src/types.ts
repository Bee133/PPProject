/** Общие типы и константы игры */

/** Тип оружия */
export type WeaponType = 'pistol' | 'shotgun' | 'laser' | 'rocket';

/** Состояние игры */
export type GameState = 'menu' | 'playing' | 'levelUp' | 'gameOver';

/** Тип улучшения при повышении уровня */
export type UpgradeId =
  | 'speed'
  | 'fireRate'
  | 'projectiles'
  | 'damage'
  | 'bulletSpeed'
  | 'heal'
  | 'pickupRadius';

/** Описание улучшения для UI */
export interface UpgradeOption {
  id: UpgradeId;
  title: string;
  description: string;
}

/** Конфигурация оружия */
export interface WeaponConfig {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletRadius: number;
  projectileCount: number;
  spread: number;
  pierce: number;
  color: string;
  glowColor: string;
}

/** Кристалл опыта на карте */
export interface Crystal {
  x: number;
  y: number;
  radius: number;
  value: number;
  color: string;
  /** Время жизни для анимации пульсации */
  pulsePhase: number;
}

/** Модификаторы игрока от улучшений */
export interface PlayerModifiers {
  speedMultiplier: number;
  fireRateMultiplier: number;
  extraProjectiles: number;
  damageMultiplier: number;
  bulletSpeedMultiplier: number;
  pickupRadiusMultiplier: number;
  pierceBonus: number;
}

/** Начальные модификаторы */
export const DEFAULT_MODIFIERS: PlayerModifiers = {
  speedMultiplier: 1,
  fireRateMultiplier: 1,
  extraProjectiles: 0,
  damageMultiplier: 1,
  bulletSpeedMultiplier: 1,
  pickupRadiusMultiplier: 1,
  pierceBonus: 0,
};

/** Конфигурации всех видов оружия */
export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  pistol: {
    type: 'pistol',
    name: 'Пистолет',
    damage: 12,
    fireRate: 3,
    bulletSpeed: 520,
    bulletRadius: 4,
    projectileCount: 1,
    spread: 0.08,
    pierce: 0,
    color: '#00f0ff',
    glowColor: '#00f0ff',
  },
  shotgun: {
    type: 'shotgun',
    name: 'Дробовик',
    damage: 8,
    fireRate: 1.2,
    bulletSpeed: 420,
    bulletRadius: 3,
    projectileCount: 5,
    spread: 0.45,
    pierce: 0,
    color: '#ff6b35',
    glowColor: '#ff6b35',
  },
  laser: {
    type: 'laser',
    name: 'Лазер',
    damage: 6,
    fireRate: 8,
    bulletSpeed: 900,
    bulletRadius: 2.5,
    projectileCount: 1,
    spread: 0.02,
    pierce: 2,
    color: '#b537ff',
    glowColor: '#e040fb',
  },
  rocket: {
    type: 'rocket',
    name: 'Ракета',
    damage: 35,
    fireRate: 0.6,
    bulletSpeed: 320,
    bulletRadius: 7,
    projectileCount: 1,
    spread: 0.05,
    pierce: 0,
    color: '#ff3366',
    glowColor: '#ff6699',
  },
};

/** Все доступные улучшения */
export const ALL_UPGRADES: UpgradeOption[] = [
  { id: 'speed', title: 'Скорость', description: '+20% скорость движения' },
  { id: 'fireRate', title: 'Скорострельность', description: '+20% скорострельность' },
  { id: 'projectiles', title: 'Снаряды', description: '+1 снаряд за выстрел' },
  { id: 'damage', title: 'Урон', description: '+25% урон' },
  { id: 'bulletSpeed', title: 'Скорость пули', description: '+15% скорость пули' },
  { id: 'heal', title: 'Лечение', description: 'Восстановить 30 HP' },
  { id: 'pickupRadius', title: 'Магнит', description: '+25% радиус сбора опыта' },
];

/** Размеры мира (бесконечная арена с большим пространством) */
export const WORLD_SIZE = 8000;

/** Базовый радиус сбора кристаллов */
export const BASE_PICKUP_RADIUS = 60;

/** Опыт для первого уровня и множитель роста */
export const BASE_XP_TO_LEVEL = 30;
export const XP_LEVEL_MULTIPLIER = 1.35;

/** Порог врагов для активации QuadTree */
export const QUADTREE_THRESHOLD = 300;
