import { MissilePool } from './MissilePool'
import { PoolableEntity } from './PoolableEntity'
import { Entity } from '@/entities/Entity'

export class PoolManager {
  private static instance: PoolManager | null = null
  
  private missilePool: MissilePool

  private constructor() {
    // ミサイルプールを初期化（大量ミサイル処理のため大きめに設定）
    this.missilePool = new MissilePool(
      200,   // 初期サイズ: 200発
      3000,  // 最大サイズ: 3000発
      100    // 成長サイズ: 100発ずつ
    )
    
    console.log('🎯 PoolManager initialized with MissilePool')
  }

  public static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager()
    }
    return PoolManager.instance
  }

  public static reset(): void {
    if (PoolManager.instance) {
      PoolManager.instance.destroy()
      PoolManager.instance = null
    }
  }

  // ミサイル取得
  public acquireMissile(
    startX: number,
    startY: number,
    target: Entity,
    damage: number = 25,
    speed: number = 300
  ): PoolableEntity | null {
    return this.missilePool.acquireMissile(startX, startY, target, damage, speed)
  }

  // ミサイル解放
  public releaseMissile(missile: PoolableEntity): void {
    this.missilePool.releaseMissile(missile)
  }

  // 大量ミサイル取得（パフォーマンステスト用）
  public acquireMultipleMissiles(
    count: number,
    startX: number,
    startY: number,
    target: Entity,
    damage: number = 25
  ): PoolableEntity[] {
    return this.missilePool.acquireMultipleMissiles(count, startX, startY, target, damage)
  }

  // 全ミサイル解放
  public releaseAllMissiles(): void {
    this.missilePool.releaseAllMissiles()
  }

  // 統計情報
  public getStats() {
    return {
      missile: this.missilePool.getStats()
    }
  }

  public logAllStats(): void {
    console.log('📊 PoolManager Statistics:')
    this.missilePool.logStats()
  }

  // パフォーマンステスト機能
  public performanceTest(missileCount: number, target: Entity): PoolableEntity[] {
    console.log(`🚀 Starting performance test: ${missileCount} missiles`)
    const startTime = performance.now()
    
    const missiles = this.acquireMultipleMissiles(
      missileCount,
      600,  // 中央付近から発射
      400,
      target
    )
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.log(`⚡ Performance Test Results:`)
    console.log(`  - Missiles created: ${missiles.length}/${missileCount}`)
    console.log(`  - Time taken: ${duration.toFixed(2)}ms`)
    console.log(`  - Rate: ${(missiles.length / (duration / 1000)).toFixed(0)} missiles/second`)
    
    this.logAllStats()
    
    return missiles
  }

  public destroy(): void {
    this.missilePool.destroy()
    console.log('🗑️ PoolManager destroyed')
  }
}