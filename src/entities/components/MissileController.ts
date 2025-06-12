import { Component } from '../Entity'
import { Entity } from '../Entity'
import { Transform } from './Transform'
import { Velocity } from './Velocity'

export interface MissileConfig {
  target: Entity
  damage: number
  speed: number
  turnRate: number // 回転速度（radians per second）
  explosionRadius: number
  lifetime: number // 生存時間（秒）
}

export class MissileController implements Component {
  public target: Entity
  public damage: number
  public speed: number
  public turnRate: number
  public explosionRadius: number
  public lifetime: number
  
  private age = 0
  private hasExploded = false
  private isActive = true

  constructor(config: MissileConfig) {
    this.target = config.target
    this.damage = config.damage
    this.speed = config.speed
    this.turnRate = config.turnRate
    this.explosionRadius = config.explosionRadius
    this.lifetime = config.lifetime
  }

  public update(deltaTime: number): void {
    if (!this.isActive || this.hasExploded) return

    this.age += deltaTime

    // 生存時間チェック
    if (this.age > this.lifetime) {
      this.explode()
      return
    }

    // ターゲットが無効になった場合
    if (!this.target || !this.target.isEntityActive()) {
      this.explode()
      return
    }

    // ミサイルの追跡処理は別途実装
    // （PhysicsSystemで呼び出される）
  }

  public updateMovement(myTransform: Transform, velocity: Velocity): void {
    if (!this.isActive || this.hasExploded) return

    const targetTransform = this.target.getComponent<Transform>('transform')
    if (!targetTransform) {
      this.explode()
      return
    }

    // ターゲットへの角度を計算
    const targetAngle = myTransform.angleTo(targetTransform)
    const currentAngle = velocity.getDirection()

    // 角度差を計算（-π から π の範囲に正規化）
    let angleDiff = targetAngle - currentAngle
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

    // 回転制限を適用
    const maxTurn = this.turnRate * (1/60) // 60FPS想定
    const actualTurn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurn)
    const newAngle = currentAngle + actualTurn

    // 新しい速度を設定
    velocity.setDirection(newAngle, this.speed)

    // ターゲットとの距離をチェック
    const distance = myTransform.distanceTo(targetTransform)
    if (distance < 10) { // 10ピクセル以内で爆発
      this.explode()
    }
  }

  public explode(): void {
    if (this.hasExploded) return

    this.hasExploded = true
    this.isActive = false

    // 爆発エフェクトと範囲ダメージは別途実装
    console.log(`💥 Missile exploded! Damage: ${this.damage}, Radius: ${this.explosionRadius}`)
  }

  public isExpired(): boolean {
    return this.hasExploded || this.age > this.lifetime
  }

  public getAge(): number {
    return this.age
  }

  public getRemainingLifetime(): number {
    return Math.max(0, this.lifetime - this.age)
  }

  public reset(config: MissileConfig): void {
    this.target = config.target
    this.damage = config.damage
    this.speed = config.speed
    this.turnRate = config.turnRate
    this.explosionRadius = config.explosionRadius
    this.lifetime = config.lifetime
    
    this.age = 0
    this.hasExploded = false
    this.isActive = true
  }

  public destroy(): void {
    this.isActive = false
    this.hasExploded = true
  }
}