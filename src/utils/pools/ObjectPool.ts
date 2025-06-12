export interface Poolable {
  reset(): void
  destroy(): void
  isPoolActive(): boolean
  setPoolActive(active: boolean): void
}

export type PoolableFactory<T> = () => T

export class ObjectPool<T extends Poolable> {
  private pool: T[] = []
  private activeObjects: Set<T> = new Set()
  private factory: PoolableFactory<T>
  private maxSize: number
  private growthSize: number

  constructor(
    factory: PoolableFactory<T>,
    initialSize: number = 50,
    maxSize: number = 1000,
    growthSize: number = 25
  ) {
    this.factory = factory
    this.maxSize = maxSize
    this.growthSize = growthSize
    
    // 初期オブジェクトを生成
    this.expand(initialSize)
  }

  private expand(count: number): void {
    const currentSize = this.pool.length + this.activeObjects.size
    const actualCount = Math.min(count, this.maxSize - currentSize)
    
    for (let i = 0; i < actualCount; i++) {
      const obj = this.factory()
      obj.setPoolActive(false)
      this.pool.push(obj)
    }
  }

  public acquire(): T | null {
    // プールが空の場合、拡張を試みる
    if (this.pool.length === 0) {
      if (this.getTotalSize() < this.maxSize) {
        this.expand(this.growthSize)
      }
      
      // それでも空の場合はnullを返す
      if (this.pool.length === 0) {
        console.warn(`ObjectPool: Cannot acquire object, pool exhausted (max: ${this.maxSize})`)
        return null
      }
    }

    const obj = this.pool.pop()!
    obj.setPoolActive(true)
    obj.reset()
    this.activeObjects.add(obj)
    
    return obj
  }

  public release(obj: T): void {
    if (!this.activeObjects.has(obj)) {
      console.warn('ObjectPool: Attempting to release object not from this pool')
      return
    }

    obj.setPoolActive(false)
    this.activeObjects.delete(obj)
    this.pool.push(obj)
  }

  public releaseAll(): void {
    for (const obj of this.activeObjects) {
      obj.setPoolActive(false)
    }
    
    this.pool.push(...this.activeObjects)
    this.activeObjects.clear()
  }

  public getActiveCount(): number {
    return this.activeObjects.size
  }

  public getPooledCount(): number {
    return this.pool.length
  }

  public getTotalSize(): number {
    return this.pool.length + this.activeObjects.size
  }

  public getUtilization(): number {
    const total = this.getTotalSize()
    return total > 0 ? this.activeObjects.size / total : 0
  }

  public getStats(): PoolStats {
    return {
      active: this.getActiveCount(),
      pooled: this.getPooledCount(),
      total: this.getTotalSize(),
      maxSize: this.maxSize,
      utilization: this.getUtilization()
    }
  }

  public destroy(): void {
    // すべてのオブジェクトを破棄
    for (const obj of this.pool) {
      obj.destroy()
    }
    for (const obj of this.activeObjects) {
      obj.destroy()
    }
    
    this.pool = []
    this.activeObjects.clear()
  }
}

export interface PoolStats {
  active: number
  pooled: number
  total: number
  maxSize: number
  utilization: number
}