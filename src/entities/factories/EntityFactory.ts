import { Entity } from '../Entity'
import { EntityManager } from '@/systems/EntityManager'
import { Transform } from '../components/Transform'
import { Velocity } from '../components/Velocity'
import { Health } from '../components/Health'
import { Weapon } from '../components/Weapon'
import { Targeting } from '../components/Targeting'
import { MissileController } from '../components/MissileController'
import { PathFollower, PathPoint } from '../components/PathFollower'
import { Renderable } from '../components/Renderable'
import { PoolManager } from '@/utils/pools/PoolManager'
import { PoolableEntity } from '@/utils/pools/PoolableEntity'
import { Tower } from '../components/Tower'
import { TowerType, getTowerConfig } from '../types/TowerTypes'
import { EnemyType, getEnemyConfig } from '../types/EnemyTypes'

export class EntityFactory {
  private entityManager: EntityManager
  private poolManager: PoolManager
  private usePooling: boolean

  constructor(entityManager: EntityManager, usePooling: boolean = true) {
    this.entityManager = entityManager
    this.usePooling = usePooling
    this.poolManager = PoolManager.getInstance()
  }

  public createTower(x: number, y: number, type: TowerType = 'basic'): Entity {
    const tower = this.entityManager.createEntity('tower')
    const config = getTowerConfig(type)

    // Transform
    const transform = new Transform(x, y)
    tower.addComponent('transform', transform)

    // Health
    const health = new Health(100)
    tower.addComponent('health', health)

    // Tower コンポーネント（新規）
    const towerComponent = new Tower(type)
    tower.addComponent('tower', towerComponent)

    // 現在の統計を取得
    const currentStats = towerComponent.getCurrentStats()

    // Weapon
    const weapon = new Weapon({
      damage: currentStats.damage,
      range: currentStats.range,
      fireRate: currentStats.fireRate,
      projectileSpeed: config.weapon.projectileSpeed,
      projectileType: config.weapon.projectileType
    })
    tower.addComponent('weapon', weapon)

    // Targeting
    const targeting = new Targeting(currentStats.range, config.targeting.strategy)
    tower.addComponent('targeting', targeting)

    // Renderable（タワータイプに応じた見た目）
    const renderable = new Renderable({
      type: 'graphics',
      color: config.visual.color,
      size: config.visual.size
    })
    renderable.drawAdvancedTower(config.visual)
    tower.addComponent('renderable', renderable)
    
    // 描画オブジェクトをエンティティのコンテナに追加
    tower.container.addChild(renderable.displayObject)

    console.log(`🏗️ Created ${config.name} at (${x}, ${y})`)
    return tower
  }

  public createEnemy(path: PathPoint[], speed: number = 50, type: EnemyType = 'basic'): Entity {
    const enemy = this.entityManager.createEntity('enemy')
    const config = getEnemyConfig(type)

    // Transform（パスの最初の位置に配置）
    const startPoint = path[0] || { x: 0, y: 0 }
    const transform = new Transform(startPoint.x, startPoint.y)
    enemy.addComponent('transform', transform)

    // Velocity
    const velocity = new Velocity(0, 0, speed || config.speed)
    enemy.addComponent('velocity', velocity)

    // Health（敵タイプに応じた体力）
    const health = new Health(config.health)
    enemy.addComponent('health', health)

    // PathFollower
    const pathFollower = new PathFollower(path, speed || config.speed)
    enemy.addComponent('pathFollower', pathFollower)

    // Renderable（敵タイプに応じた見た目）
    const renderable = new Renderable({
      type: 'graphics',
      color: config.visual.color,
      size: config.visual.size
    })
    renderable.drawAdvancedEnemy(config.visual)
    enemy.addComponent('renderable', renderable)
    
    // 描画オブジェクトをエンティティのコンテナに追加
    enemy.container.addChild(renderable.displayObject)

    console.log(`👹 Created ${config.name} enemy at (${startPoint.x}, ${startPoint.y})`)
    return enemy
  }

  public createMissile(
    startX: number,
    startY: number,
    target: Entity,
    damage: number = 25
  ): Entity {
    if (this.usePooling) {
      return this.createPooledMissile(startX, startY, target, damage)
    } else {
      return this.createDirectMissile(startX, startY, target, damage)
    }
  }

  private createPooledMissile(
    startX: number,
    startY: number,
    target: Entity,
    damage: number = 25
  ): Entity {
    const missile = this.poolManager.acquireMissile(startX, startY, target, damage)
    
    if (!missile) {
      // プールが枯渇した場合は直接生成にフォールバック
      console.warn('🚨 Missile pool exhausted, falling back to direct creation')
      return this.createDirectMissile(startX, startY, target, damage)
    }

    // ⭐ 重要：プールから取得したミサイルをEntityManagerに登録
    this.entityManager.addEntity(missile as Entity)
    
    console.log(`🎯 Pooled missile ${missile.id} registered with EntityManager`)
    return missile as Entity
  }

  private createDirectMissile(
    startX: number,
    startY: number,
    target: Entity,
    damage: number = 25
  ): Entity {
    const missile = this.entityManager.createEntity('missile')

    // Transform
    const transform = new Transform(startX, startY)
    missile.addComponent('transform', transform)

    // Velocity
    const velocity = new Velocity(0, 0, 300) // 300 pixels per second
    missile.addComponent('velocity', velocity)

    // MissileController
    const missileController = new MissileController({
      target,
      damage,
      speed: 300,
      turnRate: Math.PI * 2, // 2π radians per second (360度)
      explosionRadius: 20,
      lifetime: 5 // 5秒後に自動爆発
    })
    missile.addComponent('missileController', missileController)

    // Renderable（サイズを大きくして見やすく）
    const renderable = new Renderable({
      type: 'graphics',
      color: 0xFFFF00,
      size: 8
    })
    renderable.drawMissile()
    missile.addComponent('renderable', renderable)
    
    // 描画オブジェクトをエンティティのコンテナに追加
    missile.container.addChild(renderable.displayObject)

    return missile
  }

  public createHealthBar(parent: Entity, width: number = 30, height: number = 4): Entity {
    const healthBar = this.entityManager.createEntity('healthBar')

    // Transform（親エンティティの上に配置）
    const transform = new Transform(0, -20)
    healthBar.addComponent('transform', transform)

    // Renderable
    const renderable = new Renderable({
      type: 'graphics',
      color: 0x00FF00,
      size: width
    })
    healthBar.addComponent('renderable', renderable)

    // ヘルスバーの描画
    const graphics = renderable.displayObject as any
    graphics.clear()
    graphics.beginFill(0xFF0000) // 背景（赤）
    graphics.drawRect(-width/2, -height/2, width, height)
    graphics.endFill()
    graphics.beginFill(0x00FF00) // 前景（緑）
    graphics.drawRect(-width/2, -height/2, width, height)
    graphics.endFill()

    // 親エンティティのコンテナに追加
    parent.container.addChild(healthBar.container)

    return healthBar
  }

  // 大量ミサイル生成（パフォーマンステスト用）
  public createMultipleMissiles(
    count: number,
    startX: number,
    startY: number,
    target: Entity,
    damage: number = 25
  ): Entity[] {
    if (this.usePooling) {
      const missiles = this.poolManager.acquireMultipleMissiles(count, startX, startY, target, damage) as Entity[]
      
      // ⭐ 重要：すべてのプールミサイルをEntityManagerに追加
      for (const missile of missiles) {
        this.entityManager.addEntity(missile)
        console.log(`🎯 Bulk pooled missile ${missile.id} registered with EntityManager`)
      }
      
      return missiles
    } else {
      // 直接生成の場合
      const missiles: Entity[] = []
      for (let i = 0; i < count; i++) {
        const missile = this.createDirectMissile(
          startX + (Math.random() - 0.5) * 20,
          startY + (Math.random() - 0.5) * 20,
          target,
          damage
        )
        missiles.push(missile)
      }
      console.log(`🚀 Created ${missiles.length} missiles directly`)
      return missiles
    }
  }

  // ミサイル解放（プール使用時）
  public releaseMissile(missile: Entity): void {
    if (this.usePooling && missile instanceof PoolableEntity) {
      // プールに戻す
      this.poolManager.releaseMissile(missile)
      // ⭐ 重要：EntityManagerからも削除
      this.entityManager.removeEntity(missile.id)
      console.log(`📦 Released pooled missile ${missile.id} from EntityManager`)
    } else {
      // 直接生成されたミサイルの場合は、EntityManagerで削除
      this.entityManager.removeEntity(missile.id)
    }
  }

  // プール統計
  public getPoolStats() {
    return this.poolManager.getStats()
  }

  public logPoolStats(): void {
    this.poolManager.logAllStats()
  }

  // パフォーマンステスト実行
  public performMissileStressTest(missileCount: number, target: Entity): Entity[] {
    return this.poolManager.performanceTest(missileCount, target) as Entity[]
  }

  // プール設定
  public setPoolingEnabled(enabled: boolean): void {
    this.usePooling = enabled
    console.log(`🔧 EntityFactory pooling ${enabled ? 'enabled' : 'disabled'}`)
  }

  public isPoolingEnabled(): boolean {
    return this.usePooling
  }
}