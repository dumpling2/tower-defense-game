import { Component } from '../Entity'
import { TowerType, TowerConfig, getTowerConfig, getTowerUpgrade } from '../types/TowerTypes'

export class Tower implements Component {
  public type: TowerType
  public level: number = 0
  public config: TowerConfig
  public totalDamageDealt: number = 0
  public totalKills: number = 0
  public totalShotsFired: number = 0
  public experiencePoints: number = 0
  public sellValue: number

  constructor(type: TowerType) {
    this.type = type
    this.config = getTowerConfig(type)
    this.sellValue = Math.floor(this.config.cost * 0.7) // 建設費の70%で売却可能
  }

  public upgrade(): boolean {
    const upgradeData = getTowerUpgrade(this.type, this.level + 1)
    if (!upgradeData) {
      return false // これ以上アップグレードできない
    }

    this.level++
    this.sellValue += Math.floor(upgradeData.cost * 0.7)
    
    console.log(`🔧 Tower ${this.type} upgraded to level ${this.level}`)
    return true
  }

  public canUpgrade(): boolean {
    return getTowerUpgrade(this.type, this.level + 1) !== null
  }

  public getUpgradeCost(): number {
    const upgradeData = getTowerUpgrade(this.type, this.level + 1)
    return upgradeData ? upgradeData.cost : 0
  }

  public getCurrentStats() {
    if (this.level === 0) {
      // ベースレベル
      return {
        damage: this.config.weapon.damage,
        range: this.config.weapon.range,
        fireRate: this.config.weapon.fireRate
      }
    }

    // アップグレード後の統計
    const upgradeData = getTowerUpgrade(this.type, this.level)
    if (upgradeData) {
      return {
        damage: upgradeData.damage,
        range: upgradeData.range,
        fireRate: upgradeData.fireRate
      }
    }

    return {
      damage: this.config.weapon.damage,
      range: this.config.weapon.range,
      fireRate: this.config.weapon.fireRate
    }
  }

  public addDamage(damage: number): void {
    this.totalDamageDealt += damage
    this.experiencePoints += Math.floor(damage / 10)
  }

  public addKill(): void {
    this.totalKills++
    this.experiencePoints += 50
  }

  public addShot(): void {
    this.totalShotsFired++
  }

  public getEfficiency(): number {
    if (this.totalShotsFired === 0) return 0
    return (this.totalKills / this.totalShotsFired) * 100
  }

  public getDescription(): string {
    const stats = this.getCurrentStats()
    return `${this.config.name} Lv.${this.level}\n` +
           `ダメージ: ${stats.damage}\n` +
           `射程: ${stats.range}\n` +
           `連射速度: ${stats.fireRate.toFixed(1)}/秒\n` +
           `総ダメージ: ${this.totalDamageDealt}\n` +
           `撃破数: ${this.totalKills}\n` +
           `命中効率: ${this.getEfficiency().toFixed(1)}%`
  }

  // アップグレードUI用のメソッド追加
  public getConfig(): TowerConfig {
    return this.config
  }

  public getLevel(): number {
    return this.level
  }

  public getDamage(): number {
    return this.getCurrentStats().damage
  }

  public getRange(): number {
    return this.getCurrentStats().range
  }

  public getFireRate(): number {
    return this.getCurrentStats().fireRate
  }

  public getSellValue(): number {
    return this.sellValue
  }

  public getTotalDamageDealt(): number {
    return this.totalDamageDealt
  }

  public getTotalKills(): number {
    return this.totalKills
  }

  public getTotalShotsFired(): number {
    return this.totalShotsFired
  }

  public getUpgradeInfo() {
    if (!this.canUpgrade()) return null

    const currentStats = this.getCurrentStats()
    const nextLevel = getTowerUpgrade(this.type, this.level + 1)
    
    if (!nextLevel) return null

    return {
      cost: nextLevel.cost,
      damageIncrease: nextLevel.damage - currentStats.damage,
      rangeIncrease: nextLevel.range - currentStats.range,
      fireRateIncrease: nextLevel.fireRate - currentStats.fireRate,
      nextDamage: nextLevel.damage,
      nextRange: nextLevel.range,
      nextFireRate: nextLevel.fireRate
    }
  }

  public update(deltaTime: number): void {
    void deltaTime // 未使用パラメータ警告回避
    // タワーの更新処理（必要に応じて）
  }

  public destroy(): void {
    // クリーンアップ処理
  }
}