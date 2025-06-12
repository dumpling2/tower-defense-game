import { ObjectPool } from './ObjectPool'
import { PoolableEntity } from './PoolableEntity'
import { Entity } from '@/entities/Entity'
import { Transform } from '@/entities/components/Transform'
import { Velocity } from '@/entities/components/Velocity'
import { MissileController } from '@/entities/components/MissileController'
import { Renderable } from '@/entities/components/Renderable'

export class MissilePool {
  private pool: ObjectPool<PoolableEntity>
  private nextMissileId = 1

  constructor(
    initialSize: number = 100,
    maxSize: number = 2000,
    growthSize: number = 50
  ) {
    this.pool = new ObjectPool<PoolableEntity>(
      () => this.createMissileEntity(),
      initialSize,
      maxSize,
      growthSize
    )
  }

  private createMissileEntity(): PoolableEntity {
    const missile = new PoolableEntity(`missile_pool_${this.nextMissileId++}`, 'missile')

    // Transform
    const transform = new Transform(0, 0)
    missile.addComponent('transform', transform)

    // Velocity
    const velocity = new Velocity(0, 0, 300)
    missile.addComponent('velocity', velocity)

    // MissileController（ダミーターゲットで初期化）
    const dummyTarget = new Entity('dummy', 'dummy')
    const missileController = new MissileController({
      target: dummyTarget,
      damage: 25,
      speed: 300,
      turnRate: Math.PI * 2,
      explosionRadius: 20,
      lifetime: 5
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
    
    // 初期状態では非表示にする（プールから取り出された時に表示される）
    const renderableComponent = renderable as Renderable
    if (renderableComponent.displayObject) {
      renderableComponent.displayObject.visible = false
    }
    missile.container.visible = false

    // 初期状態では非アクティブ
    missile.setPoolActive(false)
    
    console.log(`🏭 Created pooled missile ${missile.id} (initial: invisible)`)

    return missile
  }

  public acquireMissile(
    startX: number,
    startY: number,
    target: Entity,
    damage: number = 25,
    speed: number = 300,
    turnRate: number = Math.PI * 2,
    explosionRadius: number = 20,
    lifetime: number = 5
  ): PoolableEntity | null {
    const missile = this.pool.acquire()
    if (!missile) {
      console.warn('MissilePool: Failed to acquire missile from pool')
      return null
    }

    // ミサイルを初期化
    missile.initializeMissile(startX, startY, target, damage, speed)
    
    // ミサイルコントローラーの詳細設定
    const controller = missile.getComponent<MissileController>('missileController')
    if (controller) {
      controller.reset({
        target,
        damage,
        speed,
        turnRate,
        explosionRadius,
        lifetime
      })
    }

    // 確実にミサイルを表示状態にする
    const renderable = missile.getComponent<Renderable>('renderable')
    if (renderable && renderable.displayObject) {
      renderable.displayObject.visible = true
      renderable.displayObject.alpha = 1.0
      console.log(`🎯 Missile ${missile.id} renderable set visible: ${renderable.displayObject.visible}`)
    }
    
    // コンテナも確実に表示
    missile.container.visible = true
    missile.container.alpha = 1.0

    // デバッグ情報
    console.log(`🎯 Acquired missile ${missile.id} from pool at (${startX}, ${startY})`)
    console.log(`  - Pool active: ${missile.isPoolActive()}`)
    console.log(`  - Entity active: ${missile.isEntityActive()}`)
    console.log(`  - Container visible: ${missile.container.visible}`)
    console.log(`  - Container children: ${missile.container.children.length}`)
    
    // 描画オブジェクトの状態確認
    const renderableForCheck = missile.getComponent<Renderable>('renderable')
    if (renderableForCheck && renderableForCheck.displayObject) {
      console.log(`  - Renderable visible: ${renderableForCheck.displayObject.visible}`)
      console.log(`  - Renderable alpha: ${renderableForCheck.displayObject.alpha}`)
    }
    
    return missile
  }

  public releaseMissile(missile: PoolableEntity): void {
    // ミサイルを非アクティブ化してプールに戻す
    missile.setPoolActive(false)
    this.pool.release(missile)
  }

  public releaseAllMissiles(): void {
    this.pool.releaseAll()
  }

  public getStats() {
    return {
      ...this.pool.getStats(),
      poolType: 'MissilePool'
    }
  }

  public logStats(): void {
    const stats = this.getStats()
    console.log(`🚀 MissilePool Stats:`, {
      active: stats.active,
      pooled: stats.pooled,
      total: stats.total,
      utilization: `${(stats.utilization * 100).toFixed(1)}%`,
      maxSize: stats.maxSize
    })
  }

  public destroy(): void {
    this.pool.destroy()
  }

  // パフォーマンステスト用：大量ミサイル生成
  public acquireMultipleMissiles(
    count: number,
    startX: number,
    startY: number,
    target: Entity,
    damage: number = 25
  ): PoolableEntity[] {
    const missiles: PoolableEntity[] = []
    
    for (let i = 0; i < count; i++) {
      const missile = this.acquireMissile(
        startX + (Math.random() - 0.5) * 20, // 少しランダム配置
        startY + (Math.random() - 0.5) * 20,
        target,
        damage,
        300 + Math.random() * 100 // 速度も少しランダム
      )
      
      if (missile) {
        missiles.push(missile)
      } else {
        console.warn(`Failed to acquire missile ${i + 1}/${count}`)
        break
      }
    }
    
    console.log(`🚀 Acquired ${missiles.length}/${count} missiles from pool`)
    return missiles
  }
}