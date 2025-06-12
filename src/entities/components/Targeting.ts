import { Component } from '../Entity'
import { Entity } from '../Entity'
import { Transform } from './Transform'
import { Health } from './Health'

export type TargetingStrategy = 'nearest' | 'farthest' | 'strongest' | 'weakest' | 'first' | 'last' | 'center'

export class Targeting implements Component {
  public range: number
  public strategy: TargetingStrategy
  public currentTarget: Entity | null = null
  public targetLockTime = 0 // ターゲットロック継続時間（ms）
  
  private lastTargetSearchTime = 0
  private searchInterval = 100 // 100ms毎にターゲット検索

  constructor(range: number, strategy: TargetingStrategy = 'nearest') {
    this.range = range
    this.strategy = strategy
  }

  public findTarget(enemies: Entity[], myTransform: Transform): Entity | null {
    const currentTime = Date.now()
    
    // 検索間隔チェック
    if (currentTime - this.lastTargetSearchTime < this.searchInterval) {
      return this.currentTarget
    }
    
    this.lastTargetSearchTime = currentTime

    // 現在のターゲットが有効かチェック
    if (this.currentTarget && this.isValidTarget(this.currentTarget, myTransform)) {
      return this.currentTarget
    }

    // 新しいターゲットを検索
    const validEnemies = enemies.filter(enemy => 
      enemy.isEntityActive() && this.isValidTarget(enemy, myTransform)
    )

    if (validEnemies.length === 0) {
      this.currentTarget = null
      return null
    }

    // 戦略に基づいてターゲット選択
    this.currentTarget = this.selectTargetByStrategy(validEnemies, myTransform)
    this.targetLockTime = currentTime
    
    return this.currentTarget
  }

  private isValidTarget(enemy: Entity, myTransform: Transform): boolean {
    const enemyTransform = enemy.getComponent<Transform>('transform')
    if (!enemyTransform) return false

    const distance = myTransform.distanceTo(enemyTransform)
    return distance <= this.range
  }

  private selectTargetByStrategy(enemies: Entity[], myTransform: Transform): Entity {
    switch (this.strategy) {
      case 'nearest':
        return this.findNearestEnemy(enemies, myTransform)
      case 'farthest':
        return this.findFarthestEnemy(enemies, myTransform)
      case 'strongest':
        return this.findStrongestEnemy(enemies)
      case 'weakest':
        return this.findWeakestEnemy(enemies)
      case 'center':
        return this.findCenterEnemy(enemies, myTransform)
      case 'first':
        return enemies[0]
      case 'last':
        return enemies[enemies.length - 1]
      default:
        return enemies[0]
    }
  }

  private findNearestEnemy(enemies: Entity[], myTransform: Transform): Entity {
    let nearest = enemies[0]
    let minDistance = Infinity

    for (const enemy of enemies) {
      const enemyTransform = enemy.getComponent<Transform>('transform')
      if (!enemyTransform) continue

      const distance = myTransform.distanceTo(enemyTransform)
      if (distance < minDistance) {
        minDistance = distance
        nearest = enemy
      }
    }

    return nearest
  }

  private findStrongestEnemy(enemies: Entity[]): Entity {
    let strongest = enemies[0]
    let maxHealth = 0

    for (const enemy of enemies) {
      const health = enemy.getComponent<Health>('health')
      if (health && health.current > maxHealth) {
        maxHealth = health.current
        strongest = enemy
      }
    }

    return strongest
  }

  private findWeakestEnemy(enemies: Entity[]): Entity {
    let weakest = enemies[0]
    let minHealth = Infinity

    for (const enemy of enemies) {
      const health = enemy.getComponent<Health>('health')
      if (health && health.current < minHealth) {
        minHealth = health.current
        weakest = enemy
      }
    }

    return weakest
  }

  private findFarthestEnemy(enemies: Entity[], myTransform: Transform): Entity {
    let farthest = enemies[0]
    let maxDistance = 0

    for (const enemy of enemies) {
      const enemyTransform = enemy.getComponent<Transform>('transform')
      if (!enemyTransform) continue

      const distance = myTransform.distanceTo(enemyTransform)
      if (distance > maxDistance) {
        maxDistance = distance
        farthest = enemy
      }
    }

    return farthest
  }

  private findCenterEnemy(enemies: Entity[], myTransform: Transform): Entity {
    void myTransform // 未使用パラメータ警告回避
    // 最も多くの敵が周囲にいる敵を選択（範囲攻撃に適している）
    let centerEnemy = enemies[0]
    let maxNearbyCount = 0
    const checkRadius = 50 // 50ピクセル範囲内の敵をカウント

    for (const candidate of enemies) {
      const candidateTransform = candidate.getComponent<Transform>('transform')
      if (!candidateTransform) continue

      let nearbyCount = 0
      for (const other of enemies) {
        if (candidate === other) continue
        
        const otherTransform = other.getComponent<Transform>('transform')
        if (!otherTransform) continue

        const distance = candidateTransform.distanceTo(otherTransform)
        if (distance <= checkRadius) {
          nearbyCount++
        }
      }

      if (nearbyCount > maxNearbyCount) {
        maxNearbyCount = nearbyCount
        centerEnemy = candidate
      }
    }

    return centerEnemy
  }

  public hasTarget(): boolean {
    return this.currentTarget !== null
  }

  public clearTarget(): void {
    this.currentTarget = null
    this.targetLockTime = 0
  }

  public update(deltaTime: number): void {
    void deltaTime // 未使用パラメータ警告回避
    // ターゲティングの更新処理
  }

  public destroy(): void {
    this.currentTarget = null
  }
}