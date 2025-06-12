import { Container } from 'pixi.js'
import { Particle } from './Particle'

export interface ExplosionConfig {
  x: number
  y: number
  particleCount?: number
  colors?: number[]
  minSpeed?: number
  maxSpeed?: number
  minSize?: number
  maxSize?: number
  lifetime?: number
  gravity?: number
}

/**
 * パーティクルシステム - 爆発、煙、火花などのエフェクト管理
 */
export class ParticleSystem {
  private particles: Particle[] = []
  private container: Container
  private maxParticles: number

  constructor(container: Container, maxParticles: number = 1000) {
    this.container = container
    this.maxParticles = maxParticles
  }

  /**
   * ミサイル爆発エフェクト
   */
  public createExplosion(config: ExplosionConfig): void {
    const {
      x,
      y,
      particleCount = 20,
      colors = [0xFF4500, 0xFFD700, 0xFF6B35, 0xFFFFFF, 0xFF1744],
      minSpeed = 50,
      maxSpeed = 150,
      minSize = 2,
      maxSize = 6,
      lifetime = 1.5,
      gravity = 50
    } = config

    for (let i = 0; i < particleCount; i++) {
      // ランダムな方向
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed)
      
      const particle = new Particle({
        x: x + (Math.random() - 0.5) * 10, // 少し散らす
        y: y + (Math.random() - 0.5) * 10,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color: colors[Math.floor(Math.random() * colors.length)],
        size: minSize + Math.random() * (maxSize - minSize),
        lifetime: lifetime + (Math.random() - 0.5) * 0.5,
        gravity,
        fadeOut: true,
        shrink: true
      })

      this.addParticle(particle)
    }

    console.log(`💥 Created explosion at (${x}, ${y}) with ${particleCount} particles`)
  }

  /**
   * ミサイルトレイル（軌跡）エフェクト
   */
  public createMissileTrail(x: number, y: number): void {
    if (Math.random() > 0.7) { // 30%の確率で軌跡パーティクル生成
      const particle = new Particle({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        velocity: {
          x: (Math.random() - 0.5) * 20,
          y: (Math.random() - 0.5) * 20
        },
        color: 0x87CEEB, // スカイブルー
        size: 1 + Math.random() * 2,
        lifetime: 0.3 + Math.random() * 0.2,
        fadeOut: true,
        shrink: true
      })

      this.addParticle(particle)
    }
  }

  /**
   * ヒットスパーク（敵に当たった時の火花）
   */
  public createHitSparks(x: number, y: number): void {
    const sparkCount = 8 + Math.floor(Math.random() * 6) // 8-13個

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 80 + Math.random() * 100
      
      const particle = new Particle({
        x,
        y,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color: Math.random() > 0.5 ? 0xFFFFFF : 0xFFD700, // 白か金色
        size: 1 + Math.random() * 2,
        lifetime: 0.4 + Math.random() * 0.3,
        gravity: 100,
        fadeOut: true,
        shrink: false
      })

      this.addParticle(particle)
    }
  }

  /**
   * 範囲ダメージエフェクト（衝撃波的な）
   */
  public createShockwave(x: number, y: number, radius: number): void {
    const ringParticles = Math.floor(radius / 2) // 半径に比例
    
    for (let i = 0; i < ringParticles; i++) {
      const angle = (Math.PI * 2 * i) / ringParticles
      const distance = radius * 0.8 + Math.random() * radius * 0.4
      
      const particle = new Particle({
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        velocity: {
          x: Math.cos(angle) * 30,
          y: Math.sin(angle) * 30
        },
        color: 0xFF6B35, // オレンジ
        size: 3 + Math.random() * 2,
        lifetime: 0.8 + Math.random() * 0.4,
        fadeOut: true,
        shrink: true
      })

      this.addParticle(particle)
    }
  }

  /**
   * パーティクルをシステムに追加
   */
  private addParticle(particle: Particle): void {
    // 最大数を超える場合は古いパーティクルを削除
    if (this.particles.length >= this.maxParticles) {
      const oldParticle = this.particles.shift()
      if (oldParticle) {
        oldParticle.destroy()
      }
    }

    this.particles.push(particle)
    this.container.addChild(particle.graphics)
  }

  /**
   * パーティクルシステムの更新
   */
  public update(deltaTime: number): void {
    // 逆順でループして、削除時のインデックスずれを防ぐ
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.update(deltaTime)

      if (!particle.isAlive) {
        this.particles.splice(i, 1)
        particle.destroy()
      }
    }
  }

  /**
   * 統計情報
   */
  public getStats() {
    return {
      activeParticles: this.particles.length,
      maxParticles: this.maxParticles,
      utilization: (this.particles.length / this.maxParticles) * 100
    }
  }

  /**
   * 全パーティクルをクリア
   */
  public clear(): void {
    for (const particle of this.particles) {
      particle.destroy()
    }
    this.particles = []
  }

  /**
   * タワーアップグレードエフェクト
   */
  public createUpgradeEffect(x: number, y: number): void {
    // 上向きのキラキラエフェクト
    this.createExplosion({
      x,
      y,
      particleCount: 30,
      colors: [0x00FF88, 0x00D4FF, 0xFFD700, 0xFFFFFF],
      minSpeed: 20,
      maxSpeed: 80,
      minSize: 3,
      maxSize: 8,
      lifetime: 2.0,
      gravity: -30 // 重力を逆にして上向きに
    })

    // 中心部の輝きエフェクト
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10
      const radius = 20
      const particleX = x + Math.cos(angle) * radius
      const particleY = y + Math.sin(angle) * radius
      
      this.createExplosion({
        x: particleX,
        y: particleY,
        particleCount: 5,
        colors: [0x00FF88, 0xFFD700],
        minSpeed: 10,
        maxSpeed: 30,
        minSize: 2,
        maxSize: 5,
        lifetime: 1.5,
        gravity: 0
      })
    }
    
    console.log('⬆️ Created tower upgrade effect')
  }

  /**
   * タワー売却エフェクト
   */
  public createSellEffect(x: number, y: number): void {
    // 金貨が舞い散るエフェクト
    this.createExplosion({
      x,
      y,
      particleCount: 25,
      colors: [0xFFD700, 0xFFB800, 0xFFA000, 0xFFE082],
      minSpeed: 30,
      maxSpeed: 100,
      minSize: 4,
      maxSize: 10,
      lifetime: 2.5,
      gravity: 80 // 落下エフェクト
    })

    // 煙エフェクト
    this.createExplosion({
      x,
      y,
      particleCount: 15,
      colors: [0x888888, 0xAAAAAA, 0x666666],
      minSpeed: 10,
      maxSpeed: 40,
      minSize: 8,
      maxSize: 15,
      lifetime: 3.0,
      gravity: -20 // 軽く上昇
    })
    
    console.log('💸 Created tower sell effect')
  }

  /**
   * デバッグ用：大量パーティクルテスト
   */
  public testMassiveExplosions(count: number): void {
    for (let i = 0; i < count; i++) {
      this.createExplosion({
        x: 200 + Math.random() * 800,
        y: 200 + Math.random() * 400,
        particleCount: 15 + Math.floor(Math.random() * 20)
      })
    }
    console.log(`🎆 Created ${count} explosions for particle stress test`)
  }
}