import { Container, Graphics } from 'pixi.js'
import { Entity } from '@/entities/Entity'
import { Transform } from '@/entities/components/Transform'
import { BatchRenderer } from '@/rendering/BatchRenderer'
import { PerformanceMonitor } from '@/rendering/PerformanceMonitor'

export class RenderSystem {
  private stage: Container
  private batchRenderer: BatchRenderer | undefined = undefined
  private performanceMonitor: PerformanceMonitor | undefined = undefined
  private isOptimized = false
  private frameCount = 0

  constructor(stage: Container, app?: any) {
    this.stage = stage
    
    if (app) {
      this.batchRenderer = new BatchRenderer(app)
      this.performanceMonitor = new PerformanceMonitor()
      console.log('🚀 RenderSystem: Initialized with performance optimization')
    }
  }

  public update(_deltaTime: number, entities: Entity[]): void {
    this.frameCount++
    let missileCount = 0
    let activeMissiles = 0
    let activeEntities = 0
    
    // パフォーマンス最適化: 100フレーム後かつエンティティが完全にセットアップされてから
    if (this.batchRenderer && !this.isOptimized && this.frameCount > 100 && entities.length > 50) {
      // すべてのエンティティがステージに追加されているかチェック
      const readyEntities = entities.filter(e => {
        const renderable = e.getComponent('renderable')
        return renderable && (renderable as any).displayObject && (renderable as any).displayObject.parent
      })
      
      if (readyEntities.length > 10) {
        this.batchRenderer.batchOptimizeEntities(readyEntities)
        this.isOptimized = true
        console.log(`🚀 RenderSystem: Applied batch optimization to ${readyEntities.length} entities`)
      }
    }
    
    for (const entity of entities) {
      // ミサイルデバッグ情報（最小限）
      if (entity.type === 'missile') {
        missileCount++
        if (entity.isEntityActive()) {
          activeMissiles++
        } else {
          // 非アクティブなミサイルは強制的に非表示
          entity.container.visible = false
        }
      }
      
      if (!entity.isEntityActive()) {
        // 非アクティブなエンティティはコンテナを非表示
        entity.container.visible = false
        continue
      }

      activeEntities++
      const transform = entity.getComponent<Transform>('transform')
      if (!transform) continue

      // エンティティのコンテナの位置と回転を更新
      entity.container.x = transform.x
      entity.container.y = transform.y
      entity.container.rotation = transform.rotation
      entity.container.scale.set(transform.scaleX, transform.scaleY)

      // ステージに追加されていない場合は追加
      if (!entity.container.parent) {
        this.stage.addChild(entity.container)
        
        // バッチレンダリング用コンテナがある場合はそちらに移動
        if (this.batchRenderer) {
          const batchContainer = this.batchRenderer.getBatchContainer(entity.type)
          if (batchContainer) {
            this.stage.removeChild(entity.container)
            batchContainer.addChild(entity.container)
          }
        }
        
        if (entity.type === 'missile') {
          console.log(`➕ Added missile ${entity.id} to ${this.batchRenderer ? 'batch' : 'stage'} at (${transform.x}, ${transform.y})`)
        }
      }
      
      // ミサイルの可視性を強制的に確保（最適化モードでない場合のみ）
      if (entity.type === 'missile' && entity.container.visible && !this.isOptimized) {
        entity.container.children.forEach(child => {
          if (!child.visible) {
            child.visible = true
            console.log(`🔧 Fixed missile ${entity.id} child visibility`)
          }
        })
      }
    }
    
    // パフォーマンス統計更新
    if (this.performanceMonitor) {
      this.performanceMonitor.updateEntityCount(activeEntities)
      
      // 10秒ごとにパフォーマンスレポート
      if (this.frameCount % 600 === 0) {
        this.performanceMonitor.logPerformanceReport()
        
        if (this.batchRenderer) {
          const batchStats = this.batchRenderer.getStats()
          console.log('🎨 Batch Rendering Stats:', batchStats)
        }
      }
    }
    
    // 5秒ごとにミサイル統計を表示
    if (missileCount > 0 && Date.now() % 5000 < 100) {
      console.log(`📊 Missiles: ${activeMissiles}/${missileCount} active, total entities: ${entities.length}`)
    }
  }

  public removeEntity(entity: Entity): void {
    if (entity.container.parent) {
      entity.container.parent.removeChild(entity.container)
    }
  }

  // パフォーマンス最適化制御
  public enableBatchOptimization(): void {
    if (this.batchRenderer) {
      this.isOptimized = false // 再最適化を許可
      console.log('🚀 RenderSystem: Batch optimization enabled')
    }
  }

  public disableBatchOptimization(): void {
    this.isOptimized = true // 最適化を無効化
    console.log('⏸️ RenderSystem: Batch optimization disabled')
  }

  public getBatchRenderer(): BatchRenderer | undefined {
    return this.batchRenderer
  }

  public getPerformanceMonitor(): PerformanceMonitor | undefined {
    return this.performanceMonitor
  }

  public getPerformanceStats() {
    return this.performanceMonitor?.getStats()
  }

  // デバッグ用の描画ヘルパー
  public drawDebugInfo(entity: Entity, color = 0xff0000): void {
    const transform = entity.getComponent<Transform>('transform')
    if (!transform) return

    const debugGraphics = new Graphics()
    debugGraphics.lineStyle(1, color, 0.5)
    debugGraphics.drawCircle(0, 0, 5)
    debugGraphics.moveTo(-10, 0)
    debugGraphics.lineTo(10, 0)
    debugGraphics.moveTo(0, -10)
    debugGraphics.lineTo(0, 10)

    entity.container.addChild(debugGraphics)
  }

  public destroy(): void {
    if (this.batchRenderer) {
      this.batchRenderer.destroy()
    }
    
    if (this.performanceMonitor) {
      this.performanceMonitor.destroy()
    }
    
    console.log('🗑️ RenderSystem destroyed')
  }
}