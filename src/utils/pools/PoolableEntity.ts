import { Entity } from '@/entities/Entity'
import { Poolable } from './ObjectPool'
import { Transform } from '@/entities/components/Transform'
import { Velocity } from '@/entities/components/Velocity'
import { MissileController } from '@/entities/components/MissileController'
import { Renderable } from '@/entities/components/Renderable'

export class PoolableEntity extends Entity implements Poolable {
  private poolActive = false

  public reset(): void {
    // エンティティの状態をリセット
    super.setActive(true)
    this.poolActive = true
    
    // トランスフォームのスケールと回転のみリセット（位置は個別に設定）
    const transform = this.getComponent<Transform>('transform')
    if (transform) {
      transform.setRotation(0)
      transform.setScale(1, 1)
    }

    // 速度リセット
    const velocity = this.getComponent<Velocity>('velocity')
    if (velocity) {
      velocity.stop()
    }

    // ミサイルコントローラーのリセットは個別に設定する必要がある
    // （ターゲットが変わるため）
    
    // 描画オブジェクトを表示（強制的に）
    const renderable = this.getComponent<Renderable>('renderable')
    if (renderable) {
      renderable.setVisible(true)
      renderable.setAlpha(1.0)
      
      // 描画オブジェクトの可視性も強制設定
      if (renderable.displayObject) {
        renderable.displayObject.visible = true
        renderable.displayObject.alpha = 1.0
      }
    }

    // コンテナを表示（強制的に）
    this.container.visible = true
    this.container.alpha = 1.0
    
    // すべての子要素も強制的に表示
    this.container.children.forEach(child => {
      child.visible = true
      child.alpha = 1.0
    })
    
    console.log(`🔄 PoolableEntity ${this.id} reset - all components forced visible`)
  }

  public isPoolActive(): boolean {
    return this.poolActive && super.isEntityActive()
  }

  public setPoolActive(active: boolean): void {
    this.poolActive = active
    super.setActive(active)
    
    if (!active) {
      // 非アクティブ時はコンテナと描画オブジェクトを非表示に
      this.container.visible = false
      
      const renderable = this.getComponent<Renderable>('renderable')
      if (renderable && renderable.displayObject) {
        renderable.displayObject.visible = false
      }
    } else {
      // アクティブ時は表示にする
      this.container.visible = true
      
      const renderable = this.getComponent<Renderable>('renderable')
      if (renderable && renderable.displayObject) {
        renderable.displayObject.visible = true
        renderable.displayObject.alpha = 1.0
      }
      
      console.log(`🚀 PoolableEntity ${this.id} activated - container visible: ${this.container.visible}`)
    }
  }

  // EntityのisEntityActive()をオーバーライドしてプール状態も考慮
  public isEntityActive(): boolean {
    return this.poolActive && super.isEntityActive()
  }
  
  // EntityのsetActive()をオーバーライドして可視性も制御
  public setActive(active: boolean): void {
    super.setActive(active)
    
    if (!active) {
      // 非アクティブ時は強制的に非表示
      this.container.visible = false
      
      const renderable = this.getComponent<Renderable>('renderable')
      if (renderable && renderable.displayObject) {
        renderable.displayObject.visible = false
      }
      
      console.log(`⚠️ PoolableEntity ${this.id} deactivated - forced invisible`)
    }
  }

  public initializeMissile(
    startX: number,
    startY: number,
    target: Entity,
    damage: number,
    speed: number = 300
  ): void {
    // トランスフォーム設定
    const transform = this.getComponent<Transform>('transform')
    if (transform) {
      transform.setPosition(startX, startY)
    }

    // 速度設定
    const velocity = this.getComponent<Velocity>('velocity')
    if (velocity) {
      velocity.setVelocity(0, 0)
      velocity.maxSpeed = speed
    }

    // ミサイルコントローラー更新
    const missileController = this.getComponent<MissileController>('missileController')
    if (missileController) {
      // 既存のミサイルコントローラーの値を更新
      missileController.target = target
      missileController.damage = damage
      missileController.speed = speed
      
      // 内部状態をリセット
      this.resetMissileController(missileController)
    }

    // 描画可視化と更新（ここが重要！）
    const renderable = this.getComponent<Renderable>('renderable')
    if (renderable) {
      // 描画オブジェクトを確実に表示
      if (renderable.displayObject) {
        renderable.displayObject.visible = true
        renderable.displayObject.alpha = 1.0
      }
      
      // Renderableのメソッドでも表示設定
      renderable.setVisible(true)
      renderable.setAlpha(1.0)
      
      // ミサイルの描画を再実行して確実に表示
      renderable.drawMissile()
      
      console.log(`🎯 Missile ${this.id} renderable initialized - visible: ${renderable.displayObject?.visible}`)
    }

    // コンテナの可視性を確実に設定
    this.container.visible = true
    this.container.alpha = 1.0
    
    console.log(`🎯 Missile ${this.id} fully initialized at (${startX}, ${startY})`)
    console.log(`  - Container visible: ${this.container.visible}, children: ${this.container.children.length}`)
  }

  private resetMissileController(controller: MissileController): void {
    // MissileControllerの新しいreset機能を使用
    controller.reset({
      target: controller.target,
      damage: controller.damage,
      speed: controller.speed,
      turnRate: controller.turnRate,
      explosionRadius: controller.explosionRadius,
      lifetime: controller.lifetime
    })
  }

  public destroy(): void {
    // プール使用時は実際の破棄を行わない
    // 代わりに非アクティブ化
    this.setPoolActive(false)
  }

  public forceDestroy(): void {
    // プールが破棄される時の強制破棄
    super.destroy()
  }
}