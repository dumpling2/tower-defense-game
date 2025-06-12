import { Component } from '../Entity'

export class Health implements Component {
  public current: number
  public maximum: number
  public isDead = false

  constructor(maxHealth: number) {
    this.maximum = maxHealth
    this.current = maxHealth
  }

  public takeDamage(damage: number): boolean {
    if (this.isDead) return false

    this.current = Math.max(0, this.current - damage)
    
    if (this.current <= 0) {
      this.isDead = true
      return true // 死亡を示す
    }
    
    return false
  }

  public heal(amount: number): void {
    if (this.isDead) return
    
    this.current = Math.min(this.maximum, this.current + amount)
  }

  public getHealthRatio(): number {
    return this.current / this.maximum
  }

  public isFullHealth(): boolean {
    return this.current === this.maximum
  }

  public update(deltaTime: number): void {
    void deltaTime // 未使用パラメータ警告回避
    // 必要に応じて自動回復などを実装
  }

  public destroy(): void {
    // クリーンアップ処理（現在は不要）
  }

  public reset(maxHealth?: number): void {
    if (maxHealth !== undefined) {
      this.maximum = maxHealth
    }
    this.current = this.maximum
    this.isDead = false
  }
}