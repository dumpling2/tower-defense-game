import { Component } from '../Entity'

export interface WeaponConfig {
  damage: number
  range: number
  fireRate: number // shots per second
  projectileSpeed: number
  projectileType: 'missile' | 'laser' | 'bullet'
}

export class Weapon implements Component {
  public damage: number
  public range: number
  public fireRate: number
  public projectileSpeed: number
  public projectileType: 'missile' | 'laser' | 'bullet'
  
  private lastFireTime = 0
  private fireInterval: number

  constructor(config: WeaponConfig) {
    this.damage = config.damage
    this.range = config.range
    this.fireRate = config.fireRate
    this.projectileSpeed = config.projectileSpeed
    this.projectileType = config.projectileType
    this.fireInterval = 1000 / this.fireRate // milliseconds
  }

  public canFire(): boolean {
    const currentTime = Date.now()
    return (currentTime - this.lastFireTime) >= this.fireInterval
  }

  public fire(): boolean {
    if (!this.canFire()) return false
    
    this.lastFireTime = Date.now()
    return true
  }

  public getNextFireTime(): number {
    return this.lastFireTime + this.fireInterval
  }

  public getFireCooldownRatio(): number {
    const currentTime = Date.now()
    const elapsed = currentTime - this.lastFireTime
    return Math.min(1, elapsed / this.fireInterval)
  }

  public upgrade(multiplier: number): void {
    this.damage *= multiplier
    this.fireRate *= multiplier
    this.range *= multiplier
    this.fireInterval = 1000 / this.fireRate
  }

  public update(deltaTime: number): void {
    void deltaTime // 未使用パラメータ警告回避
    // 武器の更新処理（必要に応じて）
  }

  public destroy(): void {
    // クリーンアップ処理（現在は不要）
  }
}