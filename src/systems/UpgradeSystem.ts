import { Player } from '../entities/Player';
import {
  ALL_UPGRADES,
  PlayerModifiers,
  UpgradeId,
  UpgradeOption,
  WeaponType,
} from '../types';
import { Random } from '../utils/Random';

/**
 * Система улучшений при повышении уровня.
 * Предлагает 3 случайных улучшения из пула.
 */
export class UpgradeSystem {
  /** Текущие варианты выбора (показываются в UI) */
  currentOptions: UpgradeOption[] = [];

  /** Сгенерировать 3 случайных улучшения */
  generateOptions(): UpgradeOption[] {
    this.currentOptions = Random.pickN(ALL_UPGRADES, 3);
    return this.currentOptions;
  }

  /** Применить выбранное улучшение к игроку */
  applyUpgrade(player: Player, upgradeId: UpgradeId): void {
    const mods = player.modifiers;

    switch (upgradeId) {
      case 'speed':
        mods.speedMultiplier *= 1.2;
        break;
      case 'fireRate':
        mods.fireRateMultiplier *= 1.2;
        break;
      case 'projectiles':
        mods.extraProjectiles += 1;
        break;
      case 'damage':
        mods.damageMultiplier *= 1.25;
        break;
      case 'bulletSpeed':
        mods.bulletSpeedMultiplier *= 1.15;
        break;
      case 'heal':
        player.heal(30);
        break;
      case 'pickupRadius':
        mods.pickupRadiusMultiplier *= 1.25;
        break;
    }

    // Каждые 3 уровня — смена/улучшение оружия
    if (player.level % 3 === 0) {
      this.upgradeWeapon(player);
    }
  }

  /** Автоматическое улучшение оружия по уровню */
  private upgradeWeapon(player: Player): void {
    const weapons: WeaponType[] = ['pistol', 'shotgun', 'laser', 'rocket'];
    const currentIndex = weapons.indexOf(player.weapon);
    if (currentIndex < weapons.length - 1) {
      player.weapon = weapons[currentIndex + 1];
    } else {
      // На максимальном оружии — бонус к пробиванию
      player.modifiers.pierceBonus += 1;
    }
  }

  /** Получить текущие модификаторы игрока (для WeaponSystem) */
  static getEffectiveModifiers(mods: PlayerModifiers): PlayerModifiers {
    return mods;
  }
}
