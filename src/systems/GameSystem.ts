import { Entity } from '@/entities/Entity'
import { EntityManager } from './EntityManager'
import { EntityFactory } from '@/entities/factories/EntityFactory'
import { Transform } from '@/entities/components/Transform'
import { Weapon } from '@/entities/components/Weapon'
import { Targeting } from '@/entities/components/Targeting'
import { Renderable } from '@/entities/components/Renderable'
import { GameState } from '@/game/GameState'
import { PoolableEntity } from '@/utils/pools/PoolableEntity'
import { CollisionSystem } from './CollisionSystem'
import { ParticleSystem } from '@/effects/ParticleSystem'
import { TowerType } from '@/entities/types/TowerTypes'
import { Tower } from '@/entities/components/Tower'
import { EnemyType } from '@/entities/types/EnemyTypes'
import { WaveSystem } from './WaveSystem'
import { TowerSelectionSystem } from './TowerSelectionSystem'
import { InputSystem } from './InputSystem'

export class GameSystem {
  private entityManager: EntityManager
  private entityFactory: EntityFactory
  private gameState: GameState
  private collisionSystem: CollisionSystem
  private particleSystem: ParticleSystem
  private waveSystem: WaveSystem
  private towerSelectionSystem: TowerSelectionSystem | null = null
  private lastPoolStatsTime = 0
  private lastCollisionStatsTime = 0

  constructor(entityManager: EntityManager, gameState: GameState, particleContainer: any, inputSystem?: InputSystem) {
    this.entityManager = entityManager
    this.entityFactory = new EntityFactory(entityManager, true) // プール有効
    this.gameState = gameState
    this.particleSystem = new ParticleSystem(particleContainer)
    this.collisionSystem = new CollisionSystem(gameState, this.particleSystem)
    this.waveSystem = new WaveSystem(gameState, this)
    
    // InputSystemが提供された場合、タワー選択システムを初期化
    if (inputSystem) {
      this.towerSelectionSystem = new TowerSelectionSystem(entityManager, inputSystem)
    }
  }

  public update(deltaTime?: number): void {
    const entities = this.entityManager.getEntities()
    const dt = deltaTime || 1/60 // 60FPSでフォールバック
    
    // ウェーブシステム更新
    this.waveSystem.update(dt)
    
    // タワー選択システム更新
    if (this.towerSelectionSystem) {
      this.towerSelectionSystem.update()
    }
    
    // タワーの射撃処理
    this.updateTowerShooting(entities)
    
    // ミサイルトレイルエフェクト
    this.updateMissileTrails(entities)
    
    // 効率的な衝突判定（空間分割使用）
    this.updateOptimizedCollisions(entities)
    
    // パーティクルシステム更新
    this.particleSystem.update(dt)
    
    // プール管理
    this.updatePoolManagement(entities)
    
    // ゲームロジック
    this.updateGameLogic(entities)
    
    // 定期的な統計表示
    this.updateStats()
  }

  private updateTowerShooting(entities: Entity[]): void {
    const towers = entities.filter(e => e.type === 'tower' && e.isEntityActive())
    const enemies = entities.filter(e => e.type === 'enemy' && e.isEntityActive())

    for (const tower of towers) {
      const transform = tower.getComponent<Transform>('transform')
      const weapon = tower.getComponent<Weapon>('weapon')
      const targeting = tower.getComponent<Targeting>('targeting')

      if (!transform || !weapon || !targeting) continue

      // ターゲットを検索
      const target = targeting.findTarget(enemies, transform)
      
      if (target && weapon.canFire()) {
        // ミサイルを発射
        const missile = this.entityFactory.createMissile(
          transform.x,
          transform.y,
          target,
          weapon.damage
        )

        weapon.fire()
        this.gameState.incrementMissileFired()
        
        // タワー統計更新
        const towerComponent = tower.getComponent<Tower>('tower')
        if (towerComponent) {
          towerComponent.addShot()
        }
        
        console.log(`🚀 Tower at (${transform.x}, ${transform.y}) fired missile ${missile.id} at target ${target.id}`)
        
        // ミサイルの可視性を確認
        const renderable = missile.getComponent<Renderable>('renderable')
        if (renderable) {
          console.log(`  Missile visible: ${renderable.displayObject.visible}, alpha: ${renderable.displayObject.alpha}`)
        }
      }
    }
  }

  private updateMissileTrails(entities: Entity[]): void {
    const missiles = entities.filter(e => e.type === 'missile' && e.isEntityActive())
    
    for (const missile of missiles) {
      const transform = missile.getComponent<Transform>('transform')
      if (transform) {
        this.particleSystem.createMissileTrail(transform.x, transform.y)
      }
    }
  }

  private updateOptimizedCollisions(entities: Entity[]): void {
    const missiles = entities.filter(e => e.type === 'missile')
    const enemies = entities.filter(e => e.type === 'enemy')

    // 空間分割を使った効率的な衝突判定
    this.collisionSystem.update(missiles, enemies)
  }

  // 旧メソッドは削除（CollisionSystemに移行）

  private updateGameLogic(entities: Entity[]): void {
    // ライフ減少チェック（敵がゴールに到達）
    // const inactiveEnemies = entities.filter(e => 
    //   e.type === 'enemy' && !e.isEntityActive()
    // )

    // 非アクティブな敵をチェックして、ゴール到達かどうか判定
    // （実際の実装では、敵がゴールに到達した理由を区別する必要がある）
    
    // エンティティのクリーンアップ
    this.cleanupInactiveEntities(entities)
  }

  private updatePoolManagement(entities: Entity[]): void {
    // 期限切れミサイルをプールに戻す
    const missiles = entities.filter(e => e.type === 'missile' && !e.isEntityActive())
    
    for (const missile of missiles) {
      if (missile instanceof PoolableEntity) {
        this.entityFactory.releaseMissile(missile as Entity)
      }
    }
  }

  private updateStats(): void {
    const currentTime = Date.now()
    
    // 10秒ごとにプール統計を表示
    if (currentTime - this.lastPoolStatsTime > 10000) {
      this.lastPoolStatsTime = currentTime
      this.entityFactory.logPoolStats()
    }
    
    // 5秒ごとに衝突判定統計を表示
    if (currentTime - this.lastCollisionStatsTime > 5000) {
      this.lastCollisionStatsTime = currentTime
      const stats = this.collisionSystem.getStats()
      const improvement = this.collisionSystem.getPerformanceImprovement()
      console.log(`⚡ Collision System: ${stats.checksPerformed} checks, ${stats.checksSkipped} skipped (${improvement.toFixed(1)}% improvement)`)
    }
  }

  private cleanupInactiveEntities(entities: Entity[]): void {
    // プールミサイルは updatePoolManagement() で処理されるので、ここでは除外
    const inactiveEntities = entities.filter(e => 
      !e.isEntityActive() && !(e.type === 'missile' && e instanceof PoolableEntity)
    )
    
    for (const entity of inactiveEntities) {
      this.entityManager.removeEntity(entity.id)
      console.log(`🧹 Cleaned up inactive entity ${entity.id} (${entity.type})`)
    }
  }

  // ゲームエンティティ生成のヘルパーメソッド
  public createTower(x: number, y: number, type: TowerType = 'basic'): Entity {
    return this.entityFactory.createTower(x, y, type)
  }

  public createEnemy(path: { x: number; y: number }[], speed?: number, type?: EnemyType): Entity {
    return this.entityFactory.createEnemy(path, speed, type)
  }

  public getActiveEnemyCount(): number {
    const entities = this.entityManager.getEntities()
    return entities.filter(e => e.type === 'enemy' && e.isEntityActive()).length
  }

  public getEntityFactory(): EntityFactory {
    return this.entityFactory
  }

  // 大量ミサイルパフォーマンステスト
  public performMissileStressTest(missileCount: number): void {
    const enemies = this.entityManager.getEntitiesByType('enemy')
    if (enemies.length === 0) {
      console.warn('No enemies available for missile stress test')
      return
    }

    const target = enemies[0]
    console.log(`🚀 Starting missile stress test: ${missileCount} missiles`)
    
    const missiles = this.entityFactory.performMissileStressTest(missileCount, target)
    
    console.log(`✅ Stress test completed: ${missiles.length} missiles active`)
    
    // 大量発射後の状態確認
    setTimeout(() => {
      const allEntities = this.entityManager.getEntities()
      const allMissiles = allEntities.filter(e => e.type === 'missile')
      const activeMissiles = allMissiles.filter(e => e.isEntityActive())
      const visibleMissiles = allMissiles.filter(e => e.container.visible)
      
      console.log(`📊 Post-stress test status:`)
      console.log(`  - Total missiles: ${allMissiles.length}`)
      console.log(`  - Active missiles: ${activeMissiles.length}`)
      console.log(`  - Visible missiles: ${visibleMissiles.length}`)
      
      // 不一致がある場合は警告
      if (visibleMissiles.length !== activeMissiles.length) {
        console.warn(`⚠️ Visibility mismatch: ${visibleMissiles.length} visible vs ${activeMissiles.length} active`)
        
        // 修正を試行
        this.forceFixMissileVisibility()
      }
    }, 2000)
  }
  
  // ミサイル可視性強制修正
  public forceFixMissileVisibility(): void {
    const allEntities = this.entityManager.getEntities()
    const missiles = allEntities.filter(e => e.type === 'missile')
    let fixedCount = 0
    
    for (const missile of missiles) {
      const isActive = missile.isEntityActive()
      const isVisible = missile.container.visible
      
      if (isActive && !isVisible) {
        // アクティブなのに非表示のミサイルを表示
        missile.container.visible = true
        const renderable = missile.getComponent('renderable')
        if (renderable && (renderable as any).displayObject) {
          (renderable as any).displayObject.visible = true
        }
        fixedCount++
        console.log(`🔧 Fixed invisible active missile ${missile.id}`)
      } else if (!isActive && isVisible) {
        // 非アクティブなのに表示のミサイルを非表示
        missile.container.visible = false
        const renderable = missile.getComponent('renderable')
        if (renderable && (renderable as any).displayObject) {
          (renderable as any).displayObject.visible = false
        }
        fixedCount++
        console.log(`🔧 Fixed visible inactive missile ${missile.id}`)
      }
    }
    
    console.log(`🔧 Fixed ${fixedCount} missile visibility issues`)
  }

  // 連続大量発射テスト
  public performContinuousMissileTest(missilesPerSecond: number, durationSeconds: number): void {
    const enemies = this.entityManager.getEntitiesByType('enemy')
    if (enemies.length === 0) {
      console.warn('No enemies available for continuous missile test')
      return
    }

    const target = enemies[0]
    let totalMissiles = 0
    let testStartTime = Date.now()
    
    console.log(`🔥 Starting continuous missile test: ${missilesPerSecond}/sec for ${durationSeconds}s`)
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - testStartTime) / 1000
      
      if (elapsed >= durationSeconds) {
        clearInterval(interval)
        console.log(`🏁 Continuous test completed: ${totalMissiles} total missiles fired`)
        this.entityFactory.logPoolStats()
        return
      }

      // 毎秒指定数のミサイルを発射
      const missiles = this.entityFactory.createMultipleMissiles(
        missilesPerSecond,
        600 + Math.random() * 200,
        400 + Math.random() * 200,
        target
      )
      
      totalMissiles += missiles.length
      
      if (Math.floor(elapsed) % 5 === 0 && elapsed > 0) {
        console.log(`⚡ ${elapsed}s: ${totalMissiles} missiles fired`)
      }
    }, 1000)
  }

  // プール統計取得
  public getPoolStats() {
    return this.entityFactory.getPoolStats()
  }
  
  // 衝突判定統計取得
  public getCollisionStats() {
    return this.collisionSystem.getStats()
  }
  
  // パーティクルシステム取得
  public getParticleSystem(): ParticleSystem {
    return this.particleSystem
  }

  // プール制御
  public setPoolingEnabled(enabled: boolean): void {
    this.entityFactory.setPoolingEnabled(enabled)
  }

  public isPoolingEnabled(): boolean {
    return this.entityFactory.isPoolingEnabled()
  }

  // ウェーブシステム関連メソッド
  public getWaveSystem(): WaveSystem {
    return this.waveSystem
  }

  public getCurrentWave(): number {
    return this.waveSystem.getCurrentWave()
  }

  public getWaveProgress() {
    return this.waveSystem.getWaveProgress()
  }

  public forceStartNextWave(): void {
    this.waveSystem.forceStartNextWave()
  }

  // タワーアップグレード・売却メソッド
  public upgradeTower(tower: Entity): boolean {
    const towerComponent = tower.getComponent<Tower>('tower')
    if (!towerComponent || !towerComponent.canUpgrade()) {
      return false
    }

    const upgradeInfo = towerComponent.getUpgradeInfo()
    if (!upgradeInfo || this.gameState.getMoney() < upgradeInfo.cost) {
      return false
    }

    // 資金を消費
    this.gameState.spendMoney(upgradeInfo.cost)
    
    // タワーをアップグレード
    const upgraded = towerComponent.upgrade()
    
    if (upgraded) {
      // ビジュアルエフェクト
      const transform = tower.getComponent<Transform>('transform')
      if (transform) {
        this.particleSystem.createUpgradeEffect(transform.x, transform.y)
      }
      
      console.log(`⬆️ Tower upgraded to level ${towerComponent.getLevel()}`)
    }
    
    return upgraded
  }

  public sellTower(tower: Entity): number {
    const towerComponent = tower.getComponent<Tower>('tower')
    if (!towerComponent) {
      return 0
    }

    const sellValue = towerComponent.getSellValue()
    
    // 資金を得る
    this.gameState.earnMoney(sellValue)
    
    // エフェクト
    const transform = tower.getComponent<Transform>('transform')
    if (transform) {
      this.particleSystem.createSellEffect(transform.x, transform.y)
    }
    
    // タワーを削除
    this.entityManager.removeEntity(tower.id)
    
    console.log(`💸 Tower sold for ${sellValue} coins`)
    
    return sellValue
  }

  public getTowerSelectionSystem(): TowerSelectionSystem | null {
    return this.towerSelectionSystem
  }
}