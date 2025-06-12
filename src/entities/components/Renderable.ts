import { Component } from '../Entity'
import { Graphics, Sprite, Texture } from 'pixi.js'

export type RenderableType = 'graphics' | 'sprite' | 'text'

export interface RenderableConfig {
  type: RenderableType
  color?: number
  size?: number
  texture?: Texture
  width?: number
  height?: number
}

export class Renderable implements Component {
  public type: RenderableType
  public displayObject: Graphics | Sprite
  public color: number
  public size: number

  constructor(config: RenderableConfig) {
    this.type = config.type
    this.color = config.color || 0xFFFFFF
    this.size = config.size || 10

    if (config.type === 'graphics') {
      this.displayObject = this.createGraphics()
    } else if (config.type === 'sprite' && config.texture) {
      this.displayObject = new Sprite(config.texture)
      if (config.width) this.displayObject.width = config.width
      if (config.height) this.displayObject.height = config.height
    } else {
      // デフォルトでグラフィックスを作成
      this.displayObject = this.createGraphics()
    }
  }

  private createGraphics(): Graphics {
    const graphics = new Graphics()
    this.updateGraphics(graphics)
    return graphics
  }

  private updateGraphics(graphics: Graphics): void {
    graphics.clear()
    graphics.beginFill(this.color)
    graphics.drawCircle(0, 0, this.size)
    graphics.endFill()
  }

  public setColor(color: number): void {
    this.color = color
    if (this.displayObject instanceof Graphics) {
      this.updateGraphics(this.displayObject)
    }
  }

  public setSize(size: number): void {
    this.size = size
    if (this.displayObject instanceof Graphics) {
      this.updateGraphics(this.displayObject)
    } else if (this.displayObject instanceof Sprite) {
      this.displayObject.width = size
      this.displayObject.height = size
    }
  }

  public setVisible(visible: boolean): void {
    this.displayObject.visible = visible
  }

  public setAlpha(alpha: number): void {
    this.displayObject.alpha = alpha
  }

  // 特定の形状を描画するヘルパーメソッド
  public drawTower(): void {
    if (!(this.displayObject instanceof Graphics)) return

    const graphics = this.displayObject
    graphics.clear()
    
    // タワーのベース
    graphics.beginFill(0x808080)
    graphics.drawRect(-15, -15, 30, 30)
    graphics.endFill()
    
    // タワーの砲台
    graphics.beginFill(0x606060)
    graphics.drawCircle(0, 0, 12)
    graphics.endFill()
    
    // 砲身
    graphics.beginFill(0x404040)
    graphics.drawRect(0, -2, 20, 4)
    graphics.endFill()
  }

  public drawEnemy(): void {
    if (!(this.displayObject instanceof Graphics)) return

    const graphics = this.displayObject
    graphics.clear()
    
    // 敵の本体
    graphics.beginFill(0xFF0000)
    graphics.drawCircle(0, 0, 8)
    graphics.endFill()
    
    // 敵の目印
    graphics.beginFill(0xFFFFFF)
    graphics.drawCircle(-3, -3, 2)
    graphics.drawCircle(3, -3, 2)
    graphics.endFill()
  }

  public drawMissile(): void {
    if (!(this.displayObject instanceof Graphics)) return

    const graphics = this.displayObject
    graphics.clear()
    
    // ミサイルの外枠（見やすくするため）
    graphics.lineStyle(1, 0x000000, 0.8)
    
    // ミサイルの本体（矩形）- サイズを大きく
    graphics.beginFill(0xFFFF00)
    graphics.drawRect(-6, -2, 12, 4)
    graphics.endFill()
    
    // ミサイルの先端（三角形）
    graphics.beginFill(0xFF8800)
    graphics.drawPolygon([
      6, 0,    // 先端
      3, -3,   // 上の角
      3, 3     // 下の角
    ])
    graphics.endFill()
    
    // ミサイルの軌跡エフェクト（小さな点）
    graphics.beginFill(0xFFFFFF, 0.8)
    graphics.drawCircle(-8, 0, 1.5)
    graphics.drawCircle(-10, 0, 1)
    graphics.endFill()
    
    // デバッグ用：中心点
    graphics.lineStyle(0)
    graphics.beginFill(0xFF0000, 0.5)
    graphics.drawCircle(0, 0, 1)
    graphics.endFill()
  }

  public drawAdvancedTower(visual: { color: number; size: number; barrelLength: number; baseSize: number }): void {
    if (!(this.displayObject instanceof Graphics)) return

    const graphics = this.displayObject
    graphics.clear()
    
    const halfBase = visual.baseSize / 2
    
    // タワーのベース（外枠）
    graphics.lineStyle(2, 0x000000, 0.8)
    graphics.beginFill(visual.color)
    graphics.drawRect(-halfBase, -halfBase, visual.baseSize, visual.baseSize)
    graphics.endFill()
    
    // タワーの砲台（円形）
    const turretColor = this.darkenColor(visual.color, 0.8)
    graphics.beginFill(turretColor)
    graphics.drawCircle(0, 0, visual.size / 2)
    graphics.endFill()
    
    // 砲身
    const barrelColor = this.darkenColor(visual.color, 0.6)
    graphics.beginFill(barrelColor)
    graphics.drawRect(0, -2, visual.barrelLength, 4)
    graphics.endFill()
    
    // 砲身先端
    graphics.beginFill(0x000000)
    graphics.drawCircle(visual.barrelLength, 0, 1.5)
    graphics.endFill()
    
    // 装飾（タワータイプによる差別化）
    this.addTowerDecorations(graphics, visual)
  }

  private addTowerDecorations(graphics: Graphics, visual: { color: number; size: number }): void {
    // 基本的な装飾（照準器のような模様）
    graphics.lineStyle(1, 0xFFFFFF, 0.6)
    graphics.drawCircle(0, 0, visual.size / 4)
    
    // 十字マーク
    const crossSize = visual.size / 6
    graphics.moveTo(-crossSize, 0)
    graphics.lineTo(crossSize, 0)
    graphics.moveTo(0, -crossSize)
    graphics.lineTo(0, crossSize)
  }

  public drawAdvancedEnemy(visual: { color: number; size: number; shape: 'circle' | 'square' | 'triangle' }): void {
    if (!(this.displayObject instanceof Graphics)) return

    const graphics = this.displayObject
    graphics.clear()
    
    // 敵の輪郭線
    graphics.lineStyle(1, 0x000000, 0.8)
    
    // 形状に応じた描画
    switch (visual.shape) {
      case 'circle':
        this.drawCircleEnemy(graphics, visual)
        break
      case 'square':
        this.drawSquareEnemy(graphics, visual)
        break
      case 'triangle':
        this.drawTriangleEnemy(graphics, visual)
        break
    }
    
    // 共通装飾
    this.addEnemyDecorations(graphics, visual)
  }

  private drawCircleEnemy(graphics: Graphics, visual: { color: number; size: number }): void {
    // 本体
    graphics.beginFill(visual.color)
    graphics.drawCircle(0, 0, visual.size)
    graphics.endFill()
    
    // 目
    graphics.beginFill(0xFFFFFF)
    graphics.drawCircle(-visual.size * 0.3, -visual.size * 0.3, visual.size * 0.2)
    graphics.drawCircle(visual.size * 0.3, -visual.size * 0.3, visual.size * 0.2)
    graphics.endFill()
    
    // 瞳
    graphics.beginFill(0x000000)
    graphics.drawCircle(-visual.size * 0.3, -visual.size * 0.3, visual.size * 0.1)
    graphics.drawCircle(visual.size * 0.3, -visual.size * 0.3, visual.size * 0.1)
    graphics.endFill()
  }

  private drawSquareEnemy(graphics: Graphics, visual: { color: number; size: number }): void {
    // 本体（装甲兵）
    graphics.beginFill(visual.color)
    graphics.drawRect(-visual.size, -visual.size, visual.size * 2, visual.size * 2)
    graphics.endFill()
    
    // 装甲パネル
    const panelColor = this.darkenColor(visual.color, 0.7)
    graphics.beginFill(panelColor)
    graphics.drawRect(-visual.size * 0.8, -visual.size * 0.8, visual.size * 1.6, visual.size * 0.4)
    graphics.drawRect(-visual.size * 0.8, visual.size * 0.4, visual.size * 1.6, visual.size * 0.4)
    graphics.endFill()
    
    // バイザー
    graphics.beginFill(0x000000, 0.6)
    graphics.drawRect(-visual.size * 0.6, -visual.size * 0.6, visual.size * 1.2, visual.size * 0.3)
    graphics.endFill()
  }

  private drawTriangleEnemy(graphics: Graphics, visual: { color: number; size: number }): void {
    // 本体（高速兵）
    graphics.beginFill(visual.color)
    graphics.drawPolygon([
      0, -visual.size,           // 上頂点
      -visual.size * 0.8, visual.size * 0.6,   // 左下
      visual.size * 0.8, visual.size * 0.6     // 右下
    ])
    graphics.endFill()
    
    // スピードライン
    const lineColor = this.lightenColor(visual.color, 1.3)
    graphics.lineStyle(2, lineColor, 0.8)
    graphics.moveTo(-visual.size * 0.4, 0)
    graphics.lineTo(visual.size * 0.4, 0)
    graphics.moveTo(-visual.size * 0.2, visual.size * 0.3)
    graphics.lineTo(visual.size * 0.2, visual.size * 0.3)
  }

  private addEnemyDecorations(graphics: Graphics, visual: { color: number; size: number }): void {
    // ヘルスバーの位置マーカー
    graphics.lineStyle(1, 0xFFFFFF, 0.4)
    graphics.drawRect(-visual.size, -visual.size - 4, visual.size * 2, 2)
  }

  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xFF) * factor)
    const g = Math.floor(((color >> 8) & 0xFF) * factor)
    const b = Math.floor((color & 0xFF) * factor)
    return (r << 16) | (g << 8) | b
  }

  private lightenColor(color: number, factor: number): number {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xFF) * factor))
    const g = Math.min(255, Math.floor(((color >> 8) & 0xFF) * factor))
    const b = Math.min(255, Math.floor((color & 0xFF) * factor))
    return (r << 16) | (g << 8) | b
  }

  public update(deltaTime: number): void {
    void deltaTime // 未使用パラメータ警告回避
    // 描画の更新処理（アニメーションなど）
  }

  public destroy(): void {
    if (this.displayObject) {
      this.displayObject.destroy()
    }
  }
}