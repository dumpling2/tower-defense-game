import { Component } from '../Entity'
import { Transform } from './Transform'
import { Velocity } from './Velocity'

export interface PathPoint {
  x: number
  y: number
}

export class PathFollower implements Component {
  public path: PathPoint[]
  public speed: number
  public currentIndex = 0
  public isComplete = false
  
  // private pathProgress = 0 // 0-1 の進行度（将来使用予定）

  constructor(path: PathPoint[], speed: number) {
    this.path = [...path] // パスをコピー
    this.speed = speed
  }

  public update(deltaTime: number): void {
    if (this.isComplete || this.path.length < 2) return

    // パス追従の更新処理は別途実装
    // （PhysicsSystemで呼び出される）
    void deltaTime
  }

  public updateMovement(transform: Transform, velocity: Velocity): void {
    if (this.isComplete || this.currentIndex >= this.path.length - 1) {
      this.isComplete = true
      velocity.stop()
      return
    }

    // const currentPoint = this.path[this.currentIndex] // 現在は使用していないがデバッグ用に残す
    const nextPoint = this.path[this.currentIndex + 1]

    // 次のポイントへの方向を計算
    const dx = nextPoint.x - transform.x
    const dy = nextPoint.y - transform.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 次のポイントに到達した場合
    if (distance < 5) { // 5ピクセル以内
      this.currentIndex++
      this.updateMovement(transform, velocity) // 再帰的に次のポイントをチェック
      return
    }

    // 正規化された方向ベクトル
    const dirX = dx / distance
    const dirY = dy / distance

    // 速度を設定
    velocity.setVelocity(dirX * this.speed, dirY * this.speed)
  }

  public getCurrentTarget(): PathPoint | null {
    if (this.currentIndex >= this.path.length - 1) return null
    return this.path[this.currentIndex + 1]
  }

  public getProgress(): number {
    if (this.path.length < 2) return 1

    const totalPoints = this.path.length - 1
    const baseProgress = this.currentIndex / totalPoints
    
    // 現在のセグメント内での進行度を計算（オプション）
    return Math.min(1, baseProgress)
  }

  public getRemainingDistance(): number {
    if (this.isComplete) return 0

    let distance = 0
    
    // 現在位置から次のポイントまでの距離は別途計算が必要
    // ここでは残りのパスポイント間の距離のみ計算
    for (let i = this.currentIndex + 1; i < this.path.length - 1; i++) {
      const point1 = this.path[i]
      const point2 = this.path[i + 1]
      const dx = point2.x - point1.x
      const dy = point2.y - point1.y
      distance += Math.sqrt(dx * dx + dy * dy)
    }

    return distance
  }

  public setSpeed(newSpeed: number): void {
    this.speed = newSpeed
  }

  public reset(): void {
    this.currentIndex = 0
    this.isComplete = false
    // this.pathProgress = 0 // 将来使用予定
  }

  public destroy(): void {
    this.path = []
    this.isComplete = true
  }
}