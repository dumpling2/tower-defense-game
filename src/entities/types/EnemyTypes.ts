export type EnemyType = 'basic' | 'fast' | 'heavy' | 'armored' | 'boss'

export interface EnemyConfig {
  type: EnemyType
  name: string
  description: string
  health: number
  speed: number
  reward: number
  visual: {
    color: number
    size: number
    shape: 'circle' | 'square' | 'triangle'
  }
  resistances?: {
    missile?: number     // ミサイルダメージ軽減率 (0-1)
    explosive?: number   // 爆発ダメージ軽減率 (0-1)
  }
  abilities?: {
    regeneration?: number    // 秒間回復量
    shield?: number         // シールド値
    split?: {              // 分裂能力
      count: number
      childType: EnemyType
    }
  }
}

/**
 * 敵タイプの定義
 * 各敵は異なる特性と戦略的価値を持つ
 */
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  // 基本敵 - 標準的な敵
  basic: {
    type: 'basic',
    name: 'ベーシック兵',
    description: '標準的な敵ユニット',
    health: 100,
    speed: 50,
    reward: 10,
    visual: {
      color: 0xFF0000,
      size: 8,
      shape: 'circle'
    }
  },

  // 高速敵 - 移動速度が高い
  fast: {
    type: 'fast',
    name: 'スピード兵',
    description: '高速移動する軽装兵',
    health: 60,
    speed: 90,
    reward: 15,
    visual: {
      color: 0x00FF00,
      size: 6,
      shape: 'triangle'
    }
  },

  // 重装敵 - 高体力・低速度
  heavy: {
    type: 'heavy',
    name: 'ヘビー兵',
    description: '重装甲で高耐久の兵',
    health: 300,
    speed: 25,
    reward: 25,
    visual: {
      color: 0x8B4513,
      size: 12,
      shape: 'square'
    },
    resistances: {
      missile: 0.2,    // ミサイルダメージ20%軽減
      explosive: 0.1   // 爆発ダメージ10%軽減
    }
  },

  // 装甲敵 - 高防御力
  armored: {
    type: 'armored',
    name: 'アーマー兵',
    description: '高い防御力を持つ装甲兵',
    health: 200,
    speed: 40,
    reward: 30,
    visual: {
      color: 0x4169E1,
      size: 10,
      shape: 'square'
    },
    resistances: {
      missile: 0.4,    // ミサイルダメージ40%軽減
      explosive: 0.2   // 爆発ダメージ20%軽減
    },
    abilities: {
      shield: 50,      // 50ポイントのシールド
      regeneration: 2  // 秒間2ポイント回復
    }
  },

  // ボス敵 - 最強の敵
  boss: {
    type: 'boss',
    name: 'ボス',
    description: '強大な力を持つボス敵',
    health: 1000,
    speed: 30,
    reward: 100,
    visual: {
      color: 0xFF00FF,
      size: 20,
      shape: 'circle'
    },
    resistances: {
      missile: 0.3,    // ミサイルダメージ30%軽減
      explosive: 0.1   // 爆発ダメージ10%軽減
    },
    abilities: {
      shield: 200,     // 200ポイントのシールド
      regeneration: 5  // 秒間5ポイント回復
    }
  }
}

/**
 * 敵タイプから設定を取得
 */
export function getEnemyConfig(type: EnemyType): EnemyConfig {
  return ENEMY_CONFIGS[type]
}

/**
 * 全敵タイプのリストを取得
 */
export function getAllEnemyTypes(): EnemyType[] {
  return Object.keys(ENEMY_CONFIGS) as EnemyType[]
}

/**
 * 敵の実効ダメージを計算（耐性を考慮）
 */
export function calculateEffectiveDamage(
  baseDamage: number, 
  enemyType: EnemyType, 
  damageType: 'missile' | 'explosive'
): number {
  const config = getEnemyConfig(enemyType)
  const resistance = config.resistances?.[damageType] || 0
  return Math.max(1, Math.floor(baseDamage * (1 - resistance)))
}

/**
 * ウェーブで使用する敵の組み合わせパターン
 */
export const ENEMY_WAVE_PATTERNS = {
  // 序盤ウェーブ
  early: {
    types: ['basic', 'fast'] as EnemyType[],
    weights: [0.7, 0.3]  // basic 70%, fast 30%
  },
  
  // 中盤ウェーブ
  mid: {
    types: ['basic', 'fast', 'heavy'] as EnemyType[],
    weights: [0.4, 0.4, 0.2]  // basic 40%, fast 40%, heavy 20%
  },
  
  // 後半ウェーブ
  late: {
    types: ['fast', 'heavy', 'armored'] as EnemyType[],
    weights: [0.3, 0.4, 0.3]  // fast 30%, heavy 40%, armored 30%
  },
  
  // ボスウェーブ
  boss: {
    types: ['basic', 'armored', 'boss'] as EnemyType[],
    weights: [0.4, 0.4, 0.2]  // basic 40%, armored 40%, boss 20%
  }
}