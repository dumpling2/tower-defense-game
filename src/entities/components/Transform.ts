import { Component } from '../Entity'

export class Transform implements Component {
  public x = 0
  public y = 0
  public rotation = 0
  public scaleX = 1
  public scaleY = 1

  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  public setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  public setRotation(rotation: number): void {
    this.rotation = rotation
  }

  public setScale(scaleX: number, scaleY = scaleX): void {
    this.scaleX = scaleX
    this.scaleY = scaleY
  }

  public translate(dx: number, dy: number): void {
    this.x += dx
    this.y += dy
  }

  public rotate(dRotation: number): void {
    this.rotation += dRotation
  }

  public distanceTo(other: Transform): number {
    const dx = this.x - other.x
    const dy = this.y - other.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  public angleTo(other: Transform): number {
    const dx = other.x - this.x
    const dy = other.y - this.y
    return Math.atan2(dy, dx)
  }

  public update(deltaTime: number): void {
    // Transformコンポーネントは基本的に更新処理は不要
    void deltaTime // 未使用パラメータ警告回避
  }

  public destroy(): void {
    // 特別なクリーンアップは不要
  }

  public clone(): Transform {
    const transform = new Transform(this.x, this.y)
    transform.rotation = this.rotation
    transform.scaleX = this.scaleX
    transform.scaleY = this.scaleY
    return transform
  }
}