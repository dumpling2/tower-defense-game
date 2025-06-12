import { Entity } from '@/entities/Entity'
import { Transform } from '@/entities/components/Transform'
import { MissileController } from '@/entities/components/MissileController'
import { Health } from '@/entities/components/Health'
import { SpatialHash } from '@/utils/spatial/SpatialHash'
import { GameState } from '@/game/GameState'
import { ParticleSystem } from '@/effects/ParticleSystem'

export interface CollisionStats {
  checksPerformed: number
  checksSkipped: number
  collisionsDetected: number
  spatialHashStats: any
}

/**
 * 効率的な衝突判定システム
 * 空間分割を使用して大量のエンティティ間の衝突を高速に処理
 */
export class CollisionSystem {
  private missileSpatialHash: SpatialHash
  private enemySpatialHash: SpatialHash
  private gameState: GameState
  private particleSystem: ParticleSystem
  
  // 統計情報
  private stats: CollisionStats = {
    checksPerformed: 0,
    checksSkipped: 0,
    collisionsDetected: 0,
    spatialHashStats: null
  }

  constructor(gameState: GameState, particleSystem: ParticleSystem, cellSize: number = 100) {
    this.gameState = gameState
    this.particleSystem = particleSystem
    this.missileSpatialHash = new SpatialHash(cellSize)
    this.enemySpatialHash = new SpatialHash(cellSize)
  }

  /**
   * 衝突判定の更新
   */
  public update(missiles: Entity[], enemies: Entity[]): void {
    // 統計をリセット
    this.stats.checksPerformed = 0
    this.stats.checksSkipped = 0
    this.stats.collisionsDetected = 0

    // 空間ハッシュを更新
    this.updateSpatialHashes(missiles, enemies)

    // ミサイルと敵の衝突判定
    this.checkMissileEnemyCollisions(missiles, enemies)

    // 統計情報を更新
    this.stats.spatialHashStats = {
      missile: this.missileSpatialHash.getStats(),
      enemy: this.enemySpatialHash.getStats()
    }
  }

  /**
   * 空間ハッシュの更新
   */
  private updateSpatialHashes(missiles: Entity[], enemies: Entity[]): void {
    // クリアして再構築（簡単のため）
    // 実際のゲームでは、差分更新の方が効率的
    this.missileSpatialHash.clear()
    this.enemySpatialHash.clear()

    // アクティブなミサイルを追加
    for (const missile of missiles) {
      if (missile.isEntityActive()) {
        this.missileSpatialHash.insert(missile)
      }
    }

    // アクティブな敵を追加
    for (const enemy of enemies) {
      if (enemy.isEntityActive()) {
        this.enemySpatialHash.insert(enemy)
      }
    }
  }

  /**
   * ミサイルと敵の衝突判定
   */
  private checkMissileEnemyCollisions(missiles: Entity[], enemies: Entity[]): void {
    for (const missile of missiles) {
      if (!missile.isEntityActive()) continue

      const missileTransform = missile.getComponent<Transform>('transform')
      const missileController = missile.getComponent<MissileController>('missileController')
      
      if (!missileTransform || !missileController) continue

      // 空間分割を使って近くの敵だけをチェック
      const nearbyEnemies = this.enemySpatialHash.query(
        missileTransform.x,
        missileTransform.y,
        missileController.explosionRadius + 50 // 少し余裕を持たせる
      )

      // 統計更新
      this.stats.checksPerformed += nearbyEnemies.length
      this.stats.checksSkipped += enemies.length - nearbyEnemies.length

      // 近くの敵との衝突チェック
      for (const enemy of nearbyEnemies) {
        if (!enemy.isEntityActive()) continue

        const enemyTransform = enemy.getComponent<Transform>('transform')
        if (!enemyTransform) continue

        const distance = missileTransform.distanceTo(enemyTransform)
        
        // 直撃判定（10ピクセル以内）
        if (distance < 10) {
          this.handleMissileHit(missile, enemy, true)
          break // ミサイルは1体にしか当たらない
        }
      }

      // ミサイルが期限切れの場合の範囲爆発
      if (missileController.isExpired() && missile.isEntityActive()) {
        this.handleMissileExplosion(missile, nearbyEnemies)
      }
    }
  }

  /**
   * ミサイル直撃の処理
   */
  private handleMissileHit(missile: Entity, enemy: Entity, isDirect: boolean): void {
    const missileController = missile.getComponent<MissileController>('missileController')
    const enemyHealth = enemy.getComponent<Health>('health')
    const missileTransform = missile.getComponent<Transform>('transform')
    const enemyTransform = enemy.getComponent<Transform>('transform')
    
    if (!missileController || !enemyHealth || !missileTransform || !enemyTransform) return

    // 🎆 ヒットエフェクト生成
    this.particleSystem.createHitSparks(enemyTransform.x, enemyTransform.y)

    // ダメージ処理
    const damage = isDirect ? missileController.damage : missileController.damage * 0.5
    const isDead = enemyHealth.takeDamage(damage)
    
    if (isDead) {
      enemy.setActive(false)
      this.gameState.incrementEnemiesKilled()
      this.gameState.addScore(100)
      this.gameState.earnMoney(10)
      console.log(`💀 Enemy ${enemy.id} destroyed by missile ${missile.id}!`)
    }

    // 🎆 ミサイル爆発エフェクト
    this.particleSystem.createExplosion({
      x: missileTransform.x,
      y: missileTransform.y,
      particleCount: isDirect ? 25 : 15
    })

    // ミサイルを爆発させる
    missileController.explode()
    missile.setActive(false)
    
    // プールミサイルの場合は即座に非表示にする
    if (missile.container) {
      missile.container.visible = false
    }
    
    const renderable = missile.getComponent('renderable')
    if (renderable && (renderable as any).displayObject) {
      (renderable as any).displayObject.visible = false
    }
    
    console.log(`💥 Missile ${missile.id} hit target - immediately hidden`)
    this.stats.collisionsDetected++
  }

  /**
   * ミサイル爆発による範囲ダメージ
   */
  private handleMissileExplosion(missile: Entity, nearbyEnemies: Entity[]): void {
    const missileController = missile.getComponent<MissileController>('missileController')
    const missileTransform = missile.getComponent<Transform>('transform')
    
    if (!missileController || !missileTransform) return

    console.log(`💥 Missile ${missile.id} exploded! Checking ${nearbyEnemies.length} enemies in range`)

    // 🎆 爆発エフェクト生成
    this.particleSystem.createExplosion({
      x: missileTransform.x,
      y: missileTransform.y,
      particleCount: 20
    })

    // 🎆 衝撃波エフェクト
    this.particleSystem.createShockwave(
      missileTransform.x,
      missileTransform.y,
      missileController.explosionRadius
    )

    for (const enemy of nearbyEnemies) {
      if (!enemy.isEntityActive()) continue

      const enemyTransform = enemy.getComponent<Transform>('transform')
      const enemyHealth = enemy.getComponent<Health>('health')
      
      if (!enemyTransform || !enemyHealth) continue

      const distance = missileTransform.distanceTo(enemyTransform)
      
      if (distance <= missileController.explosionRadius) {
        // 🎆 敵へのダメージエフェクト
        this.particleSystem.createHitSparks(enemyTransform.x, enemyTransform.y)

        // 距離に基づいてダメージを計算
        const damageRatio = 1 - (distance / missileController.explosionRadius)
        const actualDamage = Math.ceil(missileController.damage * damageRatio)
        
        const isDead = enemyHealth.takeDamage(actualDamage)
        
        if (isDead) {
          enemy.setActive(false)
          this.gameState.incrementEnemiesKilled()
          this.gameState.addScore(100)
          this.gameState.earnMoney(10)
          console.log(`💀 Enemy ${enemy.id} destroyed by explosion!`)
        }

        this.stats.collisionsDetected++
      }
    }

    // ミサイルを非アクティブ化
    missile.setActive(false)
    
    // プールミサイルの場合は即座に非表示にする
    if (missile.container) {
      missile.container.visible = false
    }
    
    const renderable = missile.getComponent('renderable')
    if (renderable && (renderable as any).displayObject) {
      (renderable as any).displayObject.visible = false
    }
    
    console.log(`💥 Missile ${missile.id} exploded - immediately hidden`)
  }

  /**
   * 統計情報の取得
   */
  public getStats(): CollisionStats {
    return { ...this.stats }
  }

  /**
   * パフォーマンス改善率の計算
   */
  public getPerformanceImprovement(): number {
    const totalPossibleChecks = this.stats.checksPerformed + this.stats.checksSkipped
    if (totalPossibleChecks === 0) return 0
    
    return (this.stats.checksSkipped / totalPossibleChecks) * 100
  }

  /**
   * デバッグ用：空間ハッシュの視覚化データ
   */
  public getVisualizationData() {
    return {
      missileGrid: this.missileSpatialHash.getGridVisualization(),
      enemyGrid: this.enemySpatialHash.getGridVisualization()
    }
  }
}