import { Entity } from '@/entities/Entity'
import { Transform } from '@/entities/components/Transform'

export interface SpatialBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 空間ハッシュによる効率的な衝突判定システム
 * グリッドベースの空間分割で、近くのエンティティのみをチェック
 */
export class SpatialHash {
  private cellSize: number
  private cells: Map<string, Set<Entity>> = new Map()
  private entityCells: Map<string, Set<string>> = new Map()
  
  constructor(cellSize: number = 100) {
    this.cellSize = cellSize
  }

  /**
   * エンティティを空間ハッシュに追加
   */
  public insert(entity: Entity): void {
    const transform = entity.getComponent<Transform>('transform')
    if (!transform) return

    const cellKeys = this.getCellKeys(transform.x, transform.y)
    
    // エンティティが所属するセルを記録
    this.entityCells.set(entity.id, new Set(cellKeys))
    
    // 各セルにエンティティを追加
    for (const key of cellKeys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set())
      }
      this.cells.get(key)!.add(entity)
    }
  }

  /**
   * エンティティを空間ハッシュから削除
   */
  public remove(entity: Entity): void {
    const cellKeys = this.entityCells.get(entity.id)
    if (!cellKeys) return

    // 各セルからエンティティを削除
    for (const key of cellKeys) {
      const cell = this.cells.get(key)
      if (cell) {
        cell.delete(entity)
        if (cell.size === 0) {
          this.cells.delete(key)
        }
      }
    }

    this.entityCells.delete(entity.id)
  }

  /**
   * エンティティの位置を更新
   */
  public update(entity: Entity): void {
    const transform = entity.getComponent<Transform>('transform')
    if (!transform) return

    const oldCellKeys = this.entityCells.get(entity.id)
    const newCellKeys = this.getCellKeys(transform.x, transform.y)

    // セルが変わっていない場合は何もしない
    if (oldCellKeys && this.areSetsEqual(oldCellKeys, new Set(newCellKeys))) {
      return
    }

    // 古いセルから削除して新しいセルに追加
    this.remove(entity)
    this.insert(entity)
  }

  /**
   * 指定範囲内の候補エンティティを取得
   */
  public query(x: number, y: number, radius: number): Entity[] {
    const candidates = new Set<Entity>()
    
    // 検索範囲をカバーするセルを計算
    const minX = Math.floor((x - radius) / this.cellSize)
    const maxX = Math.floor((x + radius) / this.cellSize)
    const minY = Math.floor((y - radius) / this.cellSize)
    const maxY = Math.floor((y + radius) / this.cellSize)

    // 該当するセルのエンティティを収集
    for (let cellX = minX; cellX <= maxX; cellX++) {
      for (let cellY = minY; cellY <= maxY; cellY++) {
        const key = this.getCellKey(cellX, cellY)
        const cell = this.cells.get(key)
        if (cell) {
          for (const entity of cell) {
            candidates.add(entity)
          }
        }
      }
    }

    return Array.from(candidates)
  }

  /**
   * 矩形範囲内の候補エンティティを取得
   */
  public queryRect(bounds: SpatialBounds): Entity[] {
    const candidates = new Set<Entity>()
    
    const minX = Math.floor(bounds.x / this.cellSize)
    const maxX = Math.floor((bounds.x + bounds.width) / this.cellSize)
    const minY = Math.floor(bounds.y / this.cellSize)
    const maxY = Math.floor((bounds.y + bounds.height) / this.cellSize)

    for (let cellX = minX; cellX <= maxX; cellX++) {
      for (let cellY = minY; cellY <= maxY; cellY++) {
        const key = this.getCellKey(cellX, cellY)
        const cell = this.cells.get(key)
        if (cell) {
          for (const entity of cell) {
            candidates.add(entity)
          }
        }
      }
    }

    return Array.from(candidates)
  }

  /**
   * 近くのエンティティを効率的に検索
   */
  public getNearby(entity: Entity, radius: number): Entity[] {
    const transform = entity.getComponent<Transform>('transform')
    if (!transform) return []

    const candidates = this.query(transform.x, transform.y, radius)
    
    // 自分自身を除外
    return candidates.filter(e => e.id !== entity.id)
  }

  /**
   * 全エンティティをクリア
   */
  public clear(): void {
    this.cells.clear()
    this.entityCells.clear()
  }

  /**
   * デバッグ用統計情報
   */
  public getStats() {
    let totalEntities = 0
    let maxEntitiesPerCell = 0
    let cellCount = 0

    for (const [, cell] of this.cells) {
      cellCount++
      totalEntities += cell.size
      maxEntitiesPerCell = Math.max(maxEntitiesPerCell, cell.size)
    }

    return {
      cellSize: this.cellSize,
      cellCount,
      totalEntities: this.entityCells.size,
      averageEntitiesPerCell: cellCount > 0 ? totalEntities / cellCount : 0,
      maxEntitiesPerCell
    }
  }

  /**
   * セルキーを生成
   */
  private getCellKey(cellX: number, cellY: number): string {
    return `${cellX},${cellY}`
  }

  /**
   * 座標が属するセルキーを取得（エンティティサイズを考慮）
   */
  private getCellKeys(x: number, y: number, entityRadius: number = 10): string[] {
    const keys: string[] = []
    
    // エンティティがまたがる可能性のあるセルを全て含める
    const minX = Math.floor((x - entityRadius) / this.cellSize)
    const maxX = Math.floor((x + entityRadius) / this.cellSize)
    const minY = Math.floor((y - entityRadius) / this.cellSize)
    const maxY = Math.floor((y + entityRadius) / this.cellSize)

    for (let cellX = minX; cellX <= maxX; cellX++) {
      for (let cellY = minY; cellY <= maxY; cellY++) {
        keys.push(this.getCellKey(cellX, cellY))
      }
    }

    return keys
  }

  /**
   * 2つのSetが等しいかチェック
   */
  private areSetsEqual(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size !== set2.size) return false
    for (const item of set1) {
      if (!set2.has(item)) return false
    }
    return true
  }

  /**
   * 視覚的デバッグ用：グリッドの描画情報を取得
   */
  public getGridVisualization() {
    const gridData: Array<{x: number, y: number, count: number}> = []
    
    for (const [key, cell] of this.cells) {
      const [cellX, cellY] = key.split(',').map(Number)
      gridData.push({
        x: cellX * this.cellSize,
        y: cellY * this.cellSize,
        count: cell.size
      })
    }

    return {
      cellSize: this.cellSize,
      cells: gridData
    }
  }
}