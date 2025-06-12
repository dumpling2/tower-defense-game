import { Graphics } from 'pixi.js'

export interface ParticleConfig {
  x: number
  y: number
  velocity: { x: number, y: number }
  color: number
  size: number
  lifetime: number
  gravity?: number
  fadeOut?: boolean
  shrink?: boolean
}

/**
 * 単一パーティクル（火花、破片、煙など）
 */
export class Particle {
  public x: number
  public y: number
  public velocityX: number
  public velocityY: number
  public color: number
  public size: number
  public initialSize: number
  public maxLifetime: number
  public lifetime: number
  public gravity: number
  public fadeOut: boolean
  public shrink: boolean
  public graphics: Graphics
  public isAlive = true

  constructor(config: ParticleConfig) {
    this.x = config.x
    this.y = config.y
    this.velocityX = config.velocity.x
    this.velocityY = config.velocity.y
    this.color = config.color
    this.size = config.size
    this.initialSize = config.size
    this.maxLifetime = config.lifetime
    this.lifetime = config.lifetime
    this.gravity = config.gravity || 0
    this.fadeOut = config.fadeOut || false
    this.shrink = config.shrink || false

    // 描画オブジェクトの作成
    this.graphics = new Graphics()
    this.updateGraphics()
  }

  public update(deltaTime: number): void {
    if (!this.isAlive) return

    // 物理更新
    this.x += this.velocityX * deltaTime
    this.y += this.velocityY * deltaTime
    this.velocityY += this.gravity * deltaTime

    // 寿命更新
    this.lifetime -= deltaTime
    if (this.lifetime <= 0) {
      this.isAlive = false
      return
    }

    // エフェクト更新
    const lifetimeRatio = this.lifetime / this.maxLifetime

    if (this.shrink) {
      this.size = this.initialSize * lifetimeRatio
    }

    if (this.fadeOut) {
      this.graphics.alpha = lifetimeRatio
    }

    // 描画更新
    this.updateGraphics()
  }

  private updateGraphics(): void {
    this.graphics.clear()
    this.graphics.beginFill(this.color)
    this.graphics.drawCircle(0, 0, this.size)
    this.graphics.endFill()
    this.graphics.x = this.x
    this.graphics.y = this.y
  }

  public destroy(): void {
    this.isAlive = false
    if (this.graphics.parent) {
      this.graphics.parent.removeChild(this.graphics)
    }
    this.graphics.destroy()
  }
}