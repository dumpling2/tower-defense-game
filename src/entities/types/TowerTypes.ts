import { WeaponConfig } from '../components/Weapon'
import { TargetingStrategy } from '../components/Targeting'

export type TowerType = 'basic' | 'rapid' | 'heavy' | 'sniper' | 'splash'

export interface TowerConfig {
  type: TowerType
  name: string
  description: string
  cost: number
  weapon: WeaponConfig
  targeting: {
    range: number
    strategy: TargetingStrategy
  }
  visual: {
    color: number
    size: number
    barrelLength: number
    baseSize: number
  }
  upgrades?: {
    damage: number
    range: number
    fireRate: number
    cost: number
  }[]
}

/**
 * タワータイプの定義
 * 各タワーは異なる特性と戦略を持つ
 */
export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  // 基本タワー - バランス型
  basic: {
    type: 'basic',
    name: 'ベーシックタワー',
    description: 'バランスの取れた標準的なタワー',
    cost: 100,
    weapon: {
      damage: 25,
      range: 150,
      fireRate: 2, // 2発/秒
      projectileSpeed: 200,
      projectileType: 'missile'
    },
    targeting: {
      range: 150,
      strategy: 'nearest'
    },
    visual: {
      color: 0x808080,
      size: 20,
      barrelLength: 20,
      baseSize: 30
    },
    upgrades: [
      { damage: 35, range: 170, fireRate: 2.5, cost: 150 },
      { damage: 50, range: 190, fireRate: 3, cost: 250 },
      { damage: 75, range: 210, fireRate: 3.5, cost: 400 }
    ]
  },

  // 連射タワー - 高速射撃
  rapid: {
    type: 'rapid',
    name: 'ラピッドタワー',
    description: '高速連射で敵を圧倒する',
    cost: 150,
    weapon: {
      damage: 15,
      range: 120,
      fireRate: 6, // 6発/秒
      projectileSpeed: 300,
      projectileType: 'bullet'
    },
    targeting: {
      range: 120,
      strategy: 'nearest'
    },
    visual: {
      color: 0xFF6600,
      size: 18,
      barrelLength: 25,
      baseSize: 25
    },
    upgrades: [
      { damage: 20, range: 130, fireRate: 8, cost: 200 },
      { damage: 28, range: 140, fireRate: 10, cost: 350 },
      { damage: 40, range: 150, fireRate: 12, cost: 600 }
    ]
  },

  // 重砲タワー - 高ダメージ・低射撃レート
  heavy: {
    type: 'heavy',
    name: 'ヘビータワー',
    description: '強力な一撃で敵を破壊する',
    cost: 250,
    weapon: {
      damage: 80,
      range: 180,
      fireRate: 0.8, // 0.8発/秒
      projectileSpeed: 150,
      projectileType: 'missile'
    },
    targeting: {
      range: 180,
      strategy: 'strongest'
    },
    visual: {
      color: 0x8B4513,
      size: 25,
      barrelLength: 30,
      baseSize: 40
    },
    upgrades: [
      { damage: 120, range: 200, fireRate: 1, cost: 350 },
      { damage: 180, range: 220, fireRate: 1.2, cost: 600 },
      { damage: 280, range: 250, fireRate: 1.5, cost: 1000 }
    ]
  },

  // スナイパータワー - 超長射程
  sniper: {
    type: 'sniper',
    name: 'スナイパータワー',
    description: '遠距離から精密射撃',
    cost: 300,
    weapon: {
      damage: 100,
      range: 300,
      fireRate: 1, // 1発/秒
      projectileSpeed: 500,
      projectileType: 'laser'
    },
    targeting: {
      range: 300,
      strategy: 'farthest'
    },
    visual: {
      color: 0x4169E1,
      size: 22,
      barrelLength: 35,
      baseSize: 35
    },
    upgrades: [
      { damage: 150, range: 350, fireRate: 1.2, cost: 450 },
      { damage: 220, range: 400, fireRate: 1.4, cost: 750 },
      { damage: 350, range: 450, fireRate: 1.6, cost: 1200 }
    ]
  },

  // スプラッシュタワー - 範囲攻撃
  splash: {
    type: 'splash',
    name: 'スプラッシュタワー',
    description: '爆発で周囲の敵にダメージ',
    cost: 200,
    weapon: {
      damage: 40,
      range: 140,
      fireRate: 1.5, // 1.5発/秒
      projectileSpeed: 180,
      projectileType: 'missile'
    },
    targeting: {
      range: 140,
      strategy: 'center' // 最も多くの敵がいる中心
    },
    visual: {
      color: 0xFF4500,
      size: 23,
      barrelLength: 22,
      baseSize: 35
    },
    upgrades: [
      { damage: 60, range: 160, fireRate: 2, cost: 300 },
      { damage: 90, range: 180, fireRate: 2.5, cost: 500 },
      { damage: 140, range: 200, fireRate: 3, cost: 800 }
    ]
  }
}

/**
 * タワータイプから設定を取得
 */
export function getTowerConfig(type: TowerType): TowerConfig {
  return TOWER_CONFIGS[type]
}

/**
 * 全タワータイプのリストを取得
 */
export function getAllTowerTypes(): TowerType[] {
  return Object.keys(TOWER_CONFIGS) as TowerType[]
}

/**
 * タワーのアップグレード情報を取得
 */
export function getTowerUpgrade(type: TowerType, level: number): { damage: number; range: number; fireRate: number; cost: number } | null {
  const config = TOWER_CONFIGS[type]
  if (!config.upgrades || level < 1 || level > config.upgrades.length) {
    return null
  }
  return config.upgrades[level - 1]
}