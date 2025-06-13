export type CurrencyType = 'gold' | 'crystal' | 'research' | 'energy'

export interface CurrencyAmount {
  gold: number
  crystal: number
  research: number
  energy: number
}

export interface Investment {
  id: string
  name: string
  description: string
  cost: Partial<CurrencyAmount>
  returns: Partial<CurrencyAmount>
  duration: number // seconds
  completed: boolean
  startTime: number
}

export interface UpgradeBonus {
  id: string
  name: string
  description: string
  cost: Partial<CurrencyAmount>
  effects: {
    damageMultiplier?: number
    rangeMultiplier?: number
    fireRateMultiplier?: number
    incomeMultiplier?: number
    expGainMultiplier?: number
  }
  purchased: boolean
}

/**
 * 高度な経済システム
 * 複数通貨・投資・アップグレードボーナス・複利計算を管理
 */
export class EconomySystem {
  private currencies: CurrencyAmount = {
    gold: 200,      // 基本通貨（タワー建設・アップグレード）
    crystal: 0,     // 高級通貨（特殊アップグレード・投資）
    research: 0,    // 研究通貨（技術開発・新機能解放）
    energy: 100     // エネルギー（特殊能力・ブースト使用）
  }

  private passiveIncome: CurrencyAmount = {
    gold: 0,
    crystal: 0,
    research: 0,
    energy: 1 // エネルギーは時間経過で自然回復
  }

  private activeInvestments: Investment[] = []
  private availableInvestments: Investment[] = [
    {
      id: 'gold_mine',
      name: 'ゴールドマイン',
      description: 'ゴールド採掘施設への投資（毎秒+2ゴールド）',
      cost: { gold: 500 },
      returns: { gold: 2 }, // per second
      duration: 0, // permanent
      completed: false,
      startTime: 0
    },
    {
      id: 'crystal_refinery',
      name: 'クリスタル精製所',
      description: 'クリスタル生産施設（毎秒+0.5クリスタル）',
      cost: { gold: 1000, crystal: 5 },
      returns: { crystal: 0.5 },
      duration: 0,
      completed: false,
      startTime: 0
    },
    {
      id: 'research_lab',
      name: '研究所',
      description: '技術研究施設（毎秒+1研究ポイント）',
      cost: { gold: 800, crystal: 3 },
      returns: { research: 1 },
      duration: 0,
      completed: false,
      startTime: 0
    },
    {
      id: 'energy_reactor',
      name: 'エネルギー炉',
      description: 'エネルギー生成施設（毎秒+2エネルギー）',
      cost: { gold: 600, research: 10 },
      returns: { energy: 2 },
      duration: 0,
      completed: false,
      startTime: 0
    },
    {
      id: 'compound_investment',
      name: '複利投資ファンド',
      description: '30秒後に投資額の150%を回収',
      cost: { gold: 200 },
      returns: { gold: 300 },
      duration: 30,
      completed: false,
      startTime: 0
    },
    {
      id: 'crystal_speculation',
      name: 'クリスタル投機',
      description: '60秒後にクリスタル200%回収',
      cost: { crystal: 10 },
      returns: { crystal: 20 },
      duration: 60,
      completed: false,
      startTime: 0
    }
  ]

  private upgradeBonuses: UpgradeBonus[] = [
    {
      id: 'efficient_targeting',
      name: '効率的標的システム',
      description: '全タワーの攻撃速度+20%',
      cost: { research: 50 },
      effects: { fireRateMultiplier: 1.2 },
      purchased: false
    },
    {
      id: 'advanced_ammunition',
      name: '高性能弾薬',
      description: '全タワーのダメージ+25%',
      cost: { research: 80, crystal: 5 },
      effects: { damageMultiplier: 1.25 },
      purchased: false
    },
    {
      id: 'extended_range',
      name: '射程延長技術',
      description: '全タワーの射程+15%',
      cost: { research: 60, crystal: 3 },
      effects: { rangeMultiplier: 1.15 },
      purchased: false
    },
    {
      id: 'profit_optimization',
      name: '利益最適化',
      description: '敵撃破時の報酬+50%',
      cost: { research: 100, crystal: 10 },
      effects: { incomeMultiplier: 1.5 },
      purchased: false
    },
    {
      id: 'research_acceleration',
      name: '研究加速',
      description: '研究ポイント獲得+100%',
      cost: { crystal: 20 },
      effects: { expGainMultiplier: 2.0 },
      purchased: false
    }
  ]

  private multipliers = {
    damage: 1.0,
    range: 1.0,
    fireRate: 1.0,
    income: 1.0,
    expGain: 1.0
  }

  constructor() {
    this.updateMultipliers()
  }

  /**
   * 通貨の取得
   */
  public getCurrency(type: CurrencyType): number {
    return this.currencies[type]
  }

  public getAllCurrencies(): CurrencyAmount {
    return { ...this.currencies }
  }

  /**
   * 通貨の支出
   */
  public spendCurrency(cost: Partial<CurrencyAmount>): boolean {
    // コストチェック
    for (const [type, amount] of Object.entries(cost)) {
      if (amount && this.currencies[type as CurrencyType] < amount) {
        return false
      }
    }

    // 支出実行
    for (const [type, amount] of Object.entries(cost)) {
      if (amount) {
        this.currencies[type as CurrencyType] -= amount
      }
    }

    return true
  }

  /**
   * 通貨の獲得
   */
  public earnCurrency(earnings: Partial<CurrencyAmount>): void {
    for (const [type, amount] of Object.entries(earnings)) {
      if (amount) {
        let finalAmount = amount
        
        // 収入倍率適用
        if (type === 'gold' || type === 'crystal') {
          finalAmount *= this.multipliers.income
        } else if (type === 'research') {
          finalAmount *= this.multipliers.expGain
        }

        this.currencies[type as CurrencyType] += Math.floor(finalAmount)
      }
    }
  }

  /**
   * 投資システム
   */
  public getAvailableInvestments(): Investment[] {
    return this.availableInvestments.filter(inv => !inv.completed)
  }

  public getActiveInvestments(): Investment[] {
    return this.activeInvestments
  }

  public investIn(investmentId: string): boolean {
    const investment = this.availableInvestments.find(inv => inv.id === investmentId)
    if (!investment || investment.completed) {
      return false
    }

    // コストチェック・支払い
    if (!this.spendCurrency(investment.cost)) {
      return false
    }

    // 投資実行
    if (investment.duration > 0) {
      // 期限付き投資
      const activeInvestment: Investment = {
        ...investment,
        startTime: Date.now()
      }
      this.activeInvestments.push(activeInvestment)
    } else {
      // 永続投資（パッシブ収入に追加）
      for (const [type, amount] of Object.entries(investment.returns)) {
        if (amount) {
          this.passiveIncome[type as CurrencyType] += amount
        }
      }
      investment.completed = true
    }

    console.log(`💰 Investment completed: ${investment.name}`)
    return true
  }

  /**
   * アップグレードボーナスシステム
   */
  public getAvailableUpgrades(): UpgradeBonus[] {
    return this.upgradeBonuses.filter(upgrade => !upgrade.purchased)
  }

  public getPurchasedUpgrades(): UpgradeBonus[] {
    return this.upgradeBonuses.filter(upgrade => upgrade.purchased)
  }

  public purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgradeBonuses.find(upg => upg.id === upgradeId)
    if (!upgrade || upgrade.purchased) {
      return false
    }

    // コストチェック・支払い
    if (!this.spendCurrency(upgrade.cost)) {
      return false
    }

    // アップグレード適用
    upgrade.purchased = true
    this.updateMultipliers()

    console.log(`⬆️ Upgrade purchased: ${upgrade.name}`)
    return true
  }

  /**
   * 倍率の更新
   */
  private updateMultipliers(): void {
    // リセット
    this.multipliers = {
      damage: 1.0,
      range: 1.0,
      fireRate: 1.0,
      income: 1.0,
      expGain: 1.0
    }

    // 購入済みアップグレードの効果を適用
    for (const upgrade of this.upgradeBonuses.filter(u => u.purchased)) {
      const effects = upgrade.effects
      
      if (effects.damageMultiplier) {
        this.multipliers.damage *= effects.damageMultiplier
      }
      if (effects.rangeMultiplier) {
        this.multipliers.range *= effects.rangeMultiplier
      }
      if (effects.fireRateMultiplier) {
        this.multipliers.fireRate *= effects.fireRateMultiplier
      }
      if (effects.incomeMultiplier) {
        this.multipliers.income *= effects.incomeMultiplier
      }
      if (effects.expGainMultiplier) {
        this.multipliers.expGain *= effects.expGainMultiplier
      }
    }
  }

  /**
   * 倍率の取得
   */
  public getMultipliers() {
    return { ...this.multipliers }
  }

  /**
   * システム更新（フレームごとに呼び出し）
   */
  public update(deltaTime: number): void {
    // パッシブ収入の適用
    this.earnCurrency({
      gold: this.passiveIncome.gold * deltaTime,
      crystal: this.passiveIncome.crystal * deltaTime,
      research: this.passiveIncome.research * deltaTime,
      energy: this.passiveIncome.energy * deltaTime
    })

    // アクティブ投資の完了チェック
    const currentTime = Date.now()
    for (let i = this.activeInvestments.length - 1; i >= 0; i--) {
      const investment = this.activeInvestments[i]
      const elapsed = (currentTime - investment.startTime) / 1000

      if (elapsed >= investment.duration) {
        // 投資完了・リターン獲得
        this.earnCurrency(investment.returns)
        this.activeInvestments.splice(i, 1)
        
        console.log(`💎 Investment matured: ${investment.name} - received returns!`)
      }
    }

    // エネルギーの上限制御
    this.currencies.energy = Math.min(this.currencies.energy, 1000)
  }

  /**
   * デバッグ用：通貨を直接追加
   */
  public debugAddCurrency(currencies: Partial<CurrencyAmount>): void {
    for (const [type, amount] of Object.entries(currencies)) {
      if (amount) {
        this.currencies[type as CurrencyType] += amount
      }
    }
  }

  /**
   * 統計情報
   */
  public getEconomyStats() {
    return {
      currencies: this.getAllCurrencies(),
      passiveIncome: { ...this.passiveIncome },
      activeInvestments: this.activeInvestments.length,
      purchasedUpgrades: this.upgradeBonuses.filter(u => u.purchased).length,
      totalUpgrades: this.upgradeBonuses.length,
      multipliers: this.getMultipliers()
    }
  }

  /**
   * パッシブ収入情報の取得
   */
  public getPassiveIncome(): CurrencyAmount {
    return { ...this.passiveIncome }
  }

  /**
   * 敵撃破報酬の計算
   */
  public calculateKillReward(baseReward: number): Partial<CurrencyAmount> {
    const goldReward = Math.floor(baseReward * this.multipliers.income)
    const researchReward = Math.floor(baseReward * 0.1 * this.multipliers.expGain)
    
    return {
      gold: goldReward,
      research: researchReward
    }
  }

  /**
   * ウェーブクリア報酬の計算
   */
  public calculateWaveReward(waveNumber: number): Partial<CurrencyAmount> {
    const baseGold = 50 + (waveNumber * 10)
    const baseCrystal = Math.floor(waveNumber / 5) // 5ウェーブごとに1クリスタル
    
    return {
      gold: Math.floor(baseGold * this.multipliers.income),
      crystal: baseCrystal,
      research: Math.floor(waveNumber * 2 * this.multipliers.expGain)
    }
  }

  /**
   * システムリセット
   */
  public reset(): void {
    this.currencies = {
      gold: 200,
      crystal: 0,
      research: 0,
      energy: 100
    }
    
    this.passiveIncome = {
      gold: 0,
      crystal: 0,
      research: 0,
      energy: 1
    }

    this.activeInvestments = []
    
    // アップグレードをリセット
    for (const upgrade of this.upgradeBonuses) {
      upgrade.purchased = false
    }
    
    // 投資をリセット
    for (const investment of this.availableInvestments) {
      investment.completed = false
    }

    this.updateMultipliers()
    console.log('💰 Economy system reset')
  }
}