import { Graphics, Container, Texture, Sprite } from 'pixi.js'
import { Entity } from '@/entities/Entity'

/**
 * バッチレンダリングシステム
 * 同じタイプのエンティティを効率的にバッチ描画
 */
export class BatchRenderer {
  private app: any
  private batchContainers: Map<string, Container> = new Map()
  private spriteCache: Map<string, Texture> = new Map()
  
  constructor(app: any) {
    this.app = app
    this.initializeBatches()
    this.preloadTextures()
  }

  private initializeBatches(): void {
    // エンティティタイプごとのバッチコンテナを作成
    const entityTypes = ['missile', 'enemy', 'tower', 'particle']
    
    for (const type of entityTypes) {
      const container = new Container()
      container.name = `${type}_batch`
      this.batchContainers.set(type, container)
      this.app.stage.addChild(container)
    }
    
    console.log('🎨 BatchRenderer: Initialized batch containers for rendering optimization')
  }

  private preloadTextures(): void {
    // プリレンダリングされたテクスチャを作成
    this.createMissileTexture()
    this.createEnemyTexture()
    this.createTowerTexture()
    
    console.log('📦 BatchRenderer: Preloaded entity textures')
  }

  private createMissileTexture(): void {
    const graphics = new Graphics()
    
    // ミサイルの描画
    graphics.lineStyle(1, 0x000000, 0.8)
    graphics.beginFill(0xFFFF00)
    graphics.drawRect(-6, -2, 12, 4)
    graphics.endFill()
    
    graphics.beginFill(0xFF8800)
    graphics.drawPolygon([6, 0, 3, -3, 3, 3])
    graphics.endFill()
    
    graphics.beginFill(0xFFFFFF, 0.8)
    graphics.drawCircle(-8, 0, 1.5)
    graphics.drawCircle(-10, 0, 1)
    graphics.endFill()
    
    const texture = this.app.renderer.generateTexture(graphics)
    this.spriteCache.set('missile', texture)
    graphics.destroy()
  }

  private createEnemyTexture(): void {
    const graphics = new Graphics()
    
    // 敵の描画
    graphics.beginFill(0xFF0000)
    graphics.drawCircle(0, 0, 8)
    graphics.endFill()
    
    graphics.beginFill(0xFFFFFF)
    graphics.drawCircle(-3, -3, 2)
    graphics.drawCircle(3, -3, 2)
    graphics.endFill()
    
    const texture = this.app.renderer.generateTexture(graphics)
    this.spriteCache.set('enemy', texture)
    graphics.destroy()
  }

  private createTowerTexture(): void {
    const graphics = new Graphics()
    
    // タワーの描画
    graphics.beginFill(0x808080)
    graphics.drawRect(-15, -15, 30, 30)
    graphics.endFill()
    
    graphics.beginFill(0x606060)
    graphics.drawCircle(0, 0, 12)
    graphics.endFill()
    
    graphics.beginFill(0x404040)
    graphics.drawRect(0, -2, 20, 4)
    graphics.endFill()
    
    const texture = this.app.renderer.generateTexture(graphics)
    this.spriteCache.set('tower', texture)
    graphics.destroy()
  }

  public getBatchContainer(entityType: string): Container | undefined {
    return this.batchContainers.get(entityType)
  }

  public getTexture(entityType: string): Texture | undefined {
    return this.spriteCache.get(entityType)
  }

  public optimizeEntity(entity: Entity): void {
    const texture = this.getTexture(entity.type)
    if (!texture) {
      console.warn(`🎨 No texture found for entity type: ${entity.type}`)
      return
    }

    // 既存のGraphicsをSpriteに置き換え
    const renderable = entity.getComponent('renderable')
    if (!renderable || !((renderable as any).displayObject instanceof Graphics)) {
      return // すでにSpriteか、Renderableがない
    }

    const oldDisplay = (renderable as any).displayObject as Graphics
    if (!oldDisplay) {
      console.warn(`🎨 No displayObject found for entity ${entity.id}`)
      return
    }

    try {
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5, 0.5)
      
      // 既存の位置とスケールを維持
      sprite.x = oldDisplay.x
      sprite.y = oldDisplay.y
      sprite.rotation = oldDisplay.rotation
      sprite.scale.copyFrom(oldDisplay.scale)
      sprite.alpha = oldDisplay.alpha
      sprite.visible = oldDisplay.visible

      // コンテナから古いオブジェクトを削除して新しいスプライトを追加
      const parent = oldDisplay.parent
      if (parent) {
        try {
          const index = parent.getChildIndex(oldDisplay)
          parent.removeChild(oldDisplay)
          parent.addChildAt(sprite, index)
        } catch (error) {
          console.warn(`🎨 Failed to replace in parent for ${entity.id}:`, error)
          // フォールバック: エンティティコンテナに追加
          entity.container.addChild(sprite)
        }
      } else {
        // 親がない場合はエンティティのコンテナに追加
        entity.container.addChild(sprite)
      }

      // Renderableコンポーネントの参照を更新
      (renderable as any).displayObject = sprite
      ;(renderable as any).type = 'sprite'

      // 古いGraphicsを破棄
      oldDisplay.destroy()
      console.log(`🎨 Optimized ${entity.type} ${entity.id} from Graphics to Sprite`)

    } catch (error) {
      console.error(`🎨 Failed to optimize entity ${entity.id}:`, error)
    }
  }

  public batchOptimizeEntities(entities: Entity[]): void {
    let optimizedCount = 0
    let skippedCount = 0
    
    for (const entity of entities) {
      // タワーは最適化対象から除外（各タイプで異なるビジュアルを保持するため）
      if (['missile', 'enemy'].includes(entity.type)) {
        try {
          // エンティティが適切にセットアップされているかチェック
          const renderable = entity.getComponent('renderable')
          if (renderable && (renderable as any).displayObject && entity.container) {
            this.optimizeEntity(entity)
            optimizedCount++
          } else {
            skippedCount++
          }
        } catch (error) {
          console.warn(`🎨 Failed to optimize entity ${entity.id}:`, error)
          skippedCount++
        }
      } else if (entity.type === 'tower') {
        skippedCount++ // タワーはスキップとしてカウント
      }
    }
    
    console.log(`🚀 BatchRenderer: Optimized ${optimizedCount} entities to sprites (${skippedCount} skipped, towers preserved)`)
  }

  public getStats() {
    const stats: any = {}
    
    for (const [type, container] of this.batchContainers) {
      stats[type] = {
        children: container.children.length,
        visible: container.visible
      }
    }
    
    return {
      batchContainers: stats,
      cachedTextures: this.spriteCache.size,
      totalBatchedObjects: Array.from(this.batchContainers.values())
        .reduce((sum, container) => sum + container.children.length, 0)
    }
  }

  public destroy(): void {
    // バッチコンテナを削除
    for (const container of this.batchContainers.values()) {
      container.destroy({ children: true })
    }
    this.batchContainers.clear()

    // キャッシュされたテクスチャを削除
    for (const texture of this.spriteCache.values()) {
      texture.destroy(true)
    }
    this.spriteCache.clear()
    
    console.log('🗑️ BatchRenderer destroyed')
  }
}