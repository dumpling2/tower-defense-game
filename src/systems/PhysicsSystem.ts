import { Entity } from '@/entities/Entity'
import { Transform } from '@/entities/components/Transform'
import { Velocity } from '@/entities/components/Velocity'
import { PathFollower } from '@/entities/components/PathFollower'
import { MissileController } from '@/entities/components/MissileController'

export class PhysicsSystem {
  private onEnemyReachedGoal?: (entity: Entity) => void

  constructor(onEnemyReachedGoal?: (entity: Entity) => void) {
    this.onEnemyReachedGoal = onEnemyReachedGoal
  }

  public update(deltaTime: number, entities: Entity[]): void {
    for (const entity of entities) {
      if (!entity.isEntityActive()) continue

      this.updateMovement(entity, deltaTime)
      this.updateSpecialBehaviors(entity, deltaTime)
    }
  }

  private updateMovement(entity: Entity, deltaTime: number): void {
    const transform = entity.getComponent<Transform>('transform')
    const velocity = entity.getComponent<Velocity>('velocity')

    if (!transform || !velocity) return

    // パス追従の処理
    const pathFollower = entity.getComponent<PathFollower>('pathFollower')
    if (pathFollower) {
      pathFollower.updateMovement(transform, velocity)
    }

    // ミサイル追跡の処理
    const missileController = entity.getComponent<MissileController>('missileController')
    if (missileController) {
      missileController.updateMovement(transform, velocity)
    }

    // 位置の更新
    transform.translate(velocity.vx * deltaTime, velocity.vy * deltaTime)

    // 速度の更新（摩擦など）
    velocity.update(deltaTime)
  }

  private updateSpecialBehaviors(entity: Entity, deltaTime: number): void {
    // ミサイルの生存時間管理
    const missileController = entity.getComponent<MissileController>('missileController')
    if (missileController) {
      missileController.update(deltaTime)
      
      // 期限切れのミサイルを削除対象にマーク
      if (missileController.isExpired()) {
        entity.setActive(false)
      }
    }

    // パス追従完了チェック
    const pathFollower = entity.getComponent<PathFollower>('pathFollower')
    if (pathFollower && pathFollower.isComplete) {
      // 敵がゴールに到達した場合の処理
      if (entity.type === 'enemy' && this.onEnemyReachedGoal) {
        this.onEnemyReachedGoal(entity)
      }
      entity.setActive(false)
    }
  }

  // 境界チェック
  public checkBounds(entity: Entity, width: number, height: number, bounce = false): boolean {
    const transform = entity.getComponent<Transform>('transform')
    const velocity = entity.getComponent<Velocity>('velocity')

    if (!transform) return false

    let outOfBounds = false

    if (transform.x < 0) {
      if (bounce && velocity) {
        transform.x = 0
        velocity.vx = Math.abs(velocity.vx)
      }
      outOfBounds = true
    } else if (transform.x > width) {
      if (bounce && velocity) {
        transform.x = width
        velocity.vx = -Math.abs(velocity.vx)
      }
      outOfBounds = true
    }

    if (transform.y < 0) {
      if (bounce && velocity) {
        transform.y = 0
        velocity.vy = Math.abs(velocity.vy)
      }
      outOfBounds = true
    } else if (transform.y > height) {
      if (bounce && velocity) {
        transform.y = height
        velocity.vy = -Math.abs(velocity.vy)
      }
      outOfBounds = true
    }

    return outOfBounds
  }

  // 円形の衝突判定
  public checkCircleCollision(
    entity1: Entity, 
    entity2: Entity, 
    radius1: number, 
    radius2: number
  ): boolean {
    const transform1 = entity1.getComponent<Transform>('transform')
    const transform2 = entity2.getComponent<Transform>('transform')

    if (!transform1 || !transform2) return false

    const distance = transform1.distanceTo(transform2)
    return distance < (radius1 + radius2)
  }

  // 矩形の衝突判定
  public checkRectCollision(
    entity1: Entity,
    entity2: Entity,
    width1: number,
    height1: number,
    width2: number,
    height2: number
  ): boolean {
    const transform1 = entity1.getComponent<Transform>('transform')
    const transform2 = entity2.getComponent<Transform>('transform')

    if (!transform1 || !transform2) return false

    const left1 = transform1.x - width1 / 2
    const right1 = transform1.x + width1 / 2
    const top1 = transform1.y - height1 / 2
    const bottom1 = transform1.y + height1 / 2

    const left2 = transform2.x - width2 / 2
    const right2 = transform2.x + width2 / 2
    const top2 = transform2.y - height2 / 2
    const bottom2 = transform2.y + height2 / 2

    return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2)
  }
}