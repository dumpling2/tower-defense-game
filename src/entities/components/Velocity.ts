import { Component } from '../Entity'

export class Velocity implements Component {
  public vx = 0
  public vy = 0
  public maxSpeed = Infinity
  public friction = 0

  constructor(vx = 0, vy = 0, maxSpeed = Infinity) {
    this.vx = vx
    this.vy = vy
    this.maxSpeed = maxSpeed
  }

  public setVelocity(vx: number, vy: number): void {
    this.vx = vx
    this.vy = vy
    this.clampToMaxSpeed()
  }

  public addVelocity(dvx: number, dvy: number): void {
    this.vx += dvx
    this.vy += dvy
    this.clampToMaxSpeed()
  }

  public setSpeed(speed: number): void {
    const currentSpeed = this.getSpeed()
    if (currentSpeed > 0) {
      const ratio = speed / currentSpeed
      this.vx *= ratio
      this.vy *= ratio
    }
  }

  public setDirection(angle: number, speed?: number): void {
    const actualSpeed = speed ?? this.getSpeed()
    this.vx = Math.cos(angle) * actualSpeed
    this.vy = Math.sin(angle) * actualSpeed
  }

  public getSpeed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
  }

  public getDirection(): number {
    return Math.atan2(this.vy, this.vx)
  }

  public update(deltaTime: number): void {
    // 摩擦の適用
    if (this.friction > 0) {
      const frictionFactor = Math.max(0, 1 - this.friction * deltaTime)
      this.vx *= frictionFactor
      this.vy *= frictionFactor
    }
  }

  private clampToMaxSpeed(): void {
    const speed = this.getSpeed()
    if (speed > this.maxSpeed) {
      const ratio = this.maxSpeed / speed
      this.vx *= ratio
      this.vy *= ratio
    }
  }

  public stop(): void {
    this.vx = 0
    this.vy = 0
  }
}