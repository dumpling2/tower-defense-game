import { Application, Graphics, Container, Text } from 'pixi.js'
import { MapData, MapCell, CellType, MapDataUtils } from './MapData'

export type EditorTool = 'path' | 'tower_zone' | 'obstacle' | 'start' | 'end' | 'eraser'

export interface EditorState {
  currentTool: EditorTool
  isDrawing: boolean
  gridVisible: boolean
  previewMode: boolean
}

/**
 * マップエディター
 * ドラッグ&ドロップによるビジュアルマップ編集機能
 */
export class MapEditor {
  private container: Container
  private gridContainer: Container
  private cellContainer: Container
  private uiContainer: Container
  
  private mapData: MapData
  private editorState: EditorState
  
  private cellGraphics: Graphics[][] = []
  private gridGraphics: Graphics | null = null
  
  private lastHoveredCell = { x: -1, y: -1 }
  private pathIndex = 0
  
  constructor(_app: Application, initialMapData?: MapData) {
    
    // コンテナの階層構造
    this.container = new Container()
    this.gridContainer = new Container()
    this.cellContainer = new Container()
    this.uiContainer = new Container()
    
    this.container.addChild(this.gridContainer)
    this.container.addChild(this.cellContainer)
    this.container.addChild(this.uiContainer)
    
    // マップデータの初期化
    this.mapData = initialMapData || MapDataUtils.createEmptyMap(20, 15, 32)
    
    // エディター状態の初期化
    this.editorState = {
      currentTool: 'path',
      isDrawing: false,
      gridVisible: true,
      previewMode: false
    }
    
    this.initializeEditor()
    this.setupEventListeners()
  }
  
  private initializeEditor(): void {
    this.createGrid()
    this.createCells()
    this.updateVisualCells()
    
    console.log('🗺️ Map Editor initialized')
    console.log(`  Map: ${this.mapData.config.name}`)
    console.log(`  Size: ${this.mapData.config.width}x${this.mapData.config.height}`)
    console.log(`  Current tool: ${this.editorState.currentTool}`)
  }
  
  private createGrid(): void {
    if (this.gridGraphics) {
      this.gridContainer.removeChild(this.gridGraphics)
      this.gridGraphics.destroy()
    }
    
    this.gridGraphics = new Graphics()
    const { config } = this.mapData
    
    // グリッド線の描画
    this.gridGraphics.lineStyle(1, 0x404040, 0.5)
    
    // 縦線
    for (let x = 0; x <= config.width; x++) {
      this.gridGraphics.moveTo(x * config.cellSize, 0)
      this.gridGraphics.lineTo(x * config.cellSize, config.height * config.cellSize)
    }
    
    // 横線
    for (let y = 0; y <= config.height; y++) {
      this.gridGraphics.moveTo(0, y * config.cellSize)
      this.gridGraphics.lineTo(config.width * config.cellSize, y * config.cellSize)
    }
    
    this.gridContainer.addChild(this.gridGraphics)
    this.gridContainer.visible = this.editorState.gridVisible
  }
  
  private createCells(): void {
    const { config } = this.mapData
    
    // 既存のセルグラフィックスをクリア
    this.cellGraphics.forEach(row => {
      row.forEach(cellGfx => {
        if (cellGfx.parent) {
          cellGfx.parent.removeChild(cellGfx)
        }
        cellGfx.destroy()
      })
    })
    
    this.cellGraphics = []
    
    // 新しいセルグラフィックスを作成
    for (let y = 0; y < config.height; y++) {
      this.cellGraphics[y] = []
      for (let x = 0; x < config.width; x++) {
        const cellGfx = new Graphics()
        cellGfx.x = x * config.cellSize
        cellGfx.y = y * config.cellSize
        
        // インタラクティブ設定
        cellGfx.eventMode = 'static'
        cellGfx.cursor = 'pointer'
        
        // セルのクリック・ドラッグイベント
        cellGfx.on('pointerdown', () => {
          this.onCellPointerDown(x, y)
        })
        cellGfx.on('pointerover', () => {
          this.onCellPointerOver(x, y)
        })
        cellGfx.on('pointerup', () => {
          this.onCellPointerUp()
        })
        
        this.cellGraphics[y][x] = cellGfx
        this.cellContainer.addChild(cellGfx)
      }
    }
  }
  
  private updateVisualCells(): void {
    const { config, cells } = this.mapData
    
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        this.updateCellVisual(x, y, cells[y][x])
      }
    }
  }
  
  private updateCellVisual(x: number, y: number, cell: MapCell): void {
    const cellGfx = this.cellGraphics[y][x]
    const { cellSize } = this.mapData.config
    
    cellGfx.clear()
    
    // セルタイプに応じた色分け
    let fillColor: number
    const borderColor: number = 0x666666
    let alpha = 1.0
    
    switch (cell.type) {
      case 'empty':
        fillColor = 0x2a2a2a
        alpha = 0.3
        break
      case 'path':
        fillColor = 0x8B4513
        break
      case 'start':
        fillColor = 0x00FF00
        break
      case 'end':
        fillColor = 0xFF0000
        break
      case 'tower_zone':
        fillColor = 0x4169E1
        alpha = 0.6
        break
      case 'obstacle':
        fillColor = 0x696969
        break
      default:
        fillColor = 0x2a2a2a
        alpha = 0.3
    }
    
    // セルの描画
    cellGfx.beginFill(fillColor, alpha)
    cellGfx.lineStyle(1, borderColor, 0.8)
    cellGfx.drawRect(0, 0, cellSize, cellSize)
    cellGfx.endFill()
    
    // パスインデックスの表示（パスセルの場合）
    if (cell.type === 'path' && cell.pathIndex !== undefined) {
      const text = new Text(cell.pathIndex.toString(), {
        fontSize: 12,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      })
      text.anchor.set(0.5)
      text.x = cellSize / 2
      text.y = cellSize / 2
      cellGfx.addChild(text)
    }
    
    // スタート・エンドマーカー
    if (cell.type === 'start' || cell.type === 'end') {
      const marker = new Text(cell.type === 'start' ? 'S' : 'E', {
        fontSize: 16,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      })
      marker.anchor.set(0.5)
      marker.x = cellSize / 2
      marker.y = cellSize / 2
      cellGfx.addChild(marker)
    }
  }
  
  private onCellPointerDown(x: number, y: number): void {
    if (this.editorState.previewMode) return
    
    this.editorState.isDrawing = true
    this.applyTool(x, y)
    
    // パス描画の場合、パスインデックスをリセット
    if (this.editorState.currentTool === 'path') {
      this.pathIndex = 0
    }
  }
  
  private onCellPointerOver(x: number, y: number): void {
    if (this.editorState.previewMode) return
    
    // ホバー効果
    if (this.lastHoveredCell.x !== x || this.lastHoveredCell.y !== y) {
      this.updateHoverEffect(x, y)
      this.lastHoveredCell = { x, y }
    }
    
    // ドラッグ中の描画
    if (this.editorState.isDrawing) {
      this.applyTool(x, y)
    }
  }
  
  private onCellPointerUp(): void {
    if (this.editorState.previewMode) return
    
    this.editorState.isDrawing = false
    
    // パス描画完了時にパスポイントを更新
    if (this.editorState.currentTool === 'path') {
      this.updatePathPoints()
    }
  }
  
  private updateHoverEffect(x: number, y: number): void {
    // 前回のホバー効果をクリア
    if (this.lastHoveredCell.x >= 0 && this.lastHoveredCell.y >= 0) {
      const prevCell = this.mapData.cells[this.lastHoveredCell.y][this.lastHoveredCell.x]
      this.updateCellVisual(this.lastHoveredCell.x, this.lastHoveredCell.y, prevCell)
    }
    
    // 新しいホバー効果
    const cellGfx = this.cellGraphics[y][x]
    const { cellSize } = this.mapData.config
    
    // ホバー時のハイライト
    const highlight = new Graphics()
    highlight.lineStyle(3, 0xFFFFFF, 0.8)
    highlight.drawRect(-1, -1, cellSize + 2, cellSize + 2)
    cellGfx.addChild(highlight)
    
    // 0.1秒後にハイライトを削除
    setTimeout(() => {
      if (highlight.parent) {
        highlight.parent.removeChild(highlight)
        highlight.destroy()
      }
    }, 100)
  }
  
  private applyTool(x: number, y: number): void {
    if (x < 0 || x >= this.mapData.config.width || y < 0 || y >= this.mapData.config.height) {
      return
    }
    
    const cell = this.mapData.cells[y][x]
    let newType: CellType = cell.type
    
    switch (this.editorState.currentTool) {
      case 'path':
        newType = 'path'
        cell.pathIndex = this.pathIndex++
        break
      case 'tower_zone':
        newType = 'tower_zone'
        break
      case 'obstacle':
        newType = 'obstacle'
        break
      case 'start':
        // 既存のスタート地点をクリア
        this.clearCellType('start')
        newType = 'start'
        this.mapData.startPosition = { x, y }
        break
      case 'end':
        // 既存のエンド地点をクリア
        this.clearCellType('end')
        newType = 'end'
        this.mapData.endPosition = { x, y }
        break
      case 'eraser':
        newType = 'empty'
        delete cell.pathIndex
        break
    }
    
    if (cell.type !== newType) {
      cell.type = newType
      this.updateCellVisual(x, y, cell)
      
      // マップの更新時刻を記録
      this.mapData.config.updatedAt = Date.now()
    }
  }
  
  private clearCellType(type: CellType): void {
    const { config, cells } = this.mapData
    
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        if (cells[y][x].type === type) {
          cells[y][x].type = 'empty'
          this.updateCellVisual(x, y, cells[y][x])
        }
      }
    }
  }
  
  private updatePathPoints(): void {
    const pathCells: { x: number, y: number, index: number }[] = []
    const { config, cells } = this.mapData
    
    // パスセルを収集
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = cells[y][x]
        if ((cell.type === 'path' || cell.type === 'start' || cell.type === 'end') && 
            cell.pathIndex !== undefined) {
          pathCells.push({ x, y, index: cell.pathIndex })
        }
      }
    }
    
    // インデックス順でソート
    pathCells.sort((a, b) => a.index - b.index)
    
    // パスポイントを更新
    this.mapData.pathPoints = pathCells.map(cell => {
      const worldPos = MapDataUtils.cellToWorld(cell.x, cell.y, config.cellSize)
      return {
        x: worldPos.x,
        y: worldPos.y,
        cellX: cell.x,
        cellY: cell.y
      }
    })
    
    console.log(`🛤️ Path updated: ${this.mapData.pathPoints.length} points`)
  }
  
  // エディター制御メソッド
  public setTool(tool: EditorTool): void {
    this.editorState.currentTool = tool
    console.log(`🔧 Tool changed to: ${tool}`)
  }
  
  public toggleGrid(): void {
    this.editorState.gridVisible = !this.editorState.gridVisible
    this.gridContainer.visible = this.editorState.gridVisible
    console.log(`🔲 Grid ${this.editorState.gridVisible ? 'shown' : 'hidden'}`)
  }
  
  public togglePreviewMode(): void {
    this.editorState.previewMode = !this.editorState.previewMode
    
    if (this.editorState.previewMode) {
      // プレビューモード：エディット機能を無効化
      this.cellContainer.eventMode = 'none'
      console.log('👁️ Preview mode enabled')
    } else {
      // エディットモード：エディット機能を有効化
      this.cellContainer.eventMode = 'auto'
      console.log('✏️ Edit mode enabled')
    }
  }
  
  public clearMap(): void {
    const { config, cells } = this.mapData
    
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        cells[y][x].type = 'empty'
        delete cells[y][x].pathIndex
        this.updateCellVisual(x, y, cells[y][x])
      }
    }
    
    this.mapData.pathPoints = []
    this.mapData.towerZones = []
    this.pathIndex = 0
    
    console.log('🗑️ Map cleared')
  }
  
  public generateAutoPath(): void {
    this.clearMap()
    
    // 自動パス生成
    this.mapData.pathPoints = MapDataUtils.generateStraightPath(this.mapData)
    this.updateVisualCells()
    
    console.log('🤖 Auto path generated')
  }
  
  public generateTowerZones(): void {
    // 既存のタワーゾーンをクリア
    const { config, cells } = this.mapData
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        if (cells[y][x].type === 'tower_zone') {
          cells[y][x].type = 'empty'
        }
      }
    }
    
    // 自動タワーゾーン生成
    MapDataUtils.generateTowerZones(this.mapData)
    this.updateVisualCells()
    
    console.log(`🏗️ Generated ${this.mapData.towerZones.length} tower zones`)
  }
  
  public validateMap(): { valid: boolean, issues: string[] } {
    const validation = MapDataUtils.validateMapData(this.mapData)
    
    console.log('✅ Map validation:')
    console.log(`  Valid: ${validation.valid}`)
    if (validation.issues.length > 0) {
      console.log('  Issues:')
      validation.issues.forEach(issue => console.log(`    - ${issue}`))
    }
    
    return validation
  }
  
  public exportMap(): string {
    try {
      const json = MapDataUtils.toJSON(this.mapData)
      console.log('📁 Map exported to JSON')
      return json
    } catch (error) {
      console.error('❌ Export failed:', error)
      throw error
    }
  }
  
  public importMap(json: string): void {
    try {
      const newMapData = MapDataUtils.fromJSON(json)
      this.mapData = newMapData
      
      // エディターを再構築
      this.createGrid()
      this.createCells()
      this.updateVisualCells()
      
      console.log('📁 Map imported successfully')
      console.log(`  Name: ${this.mapData.config.name}`)
      console.log(`  Size: ${this.mapData.config.width}x${this.mapData.config.height}`)
    } catch (error) {
      console.error('❌ Import failed:', error)
      throw error
    }
  }
  
  public resizeMap(width: number, height: number): void {
    const oldData = this.mapData
    this.mapData = MapDataUtils.createEmptyMap(width, height, oldData.config.cellSize)
    
    // 既存データを可能な限りコピー
    const minWidth = Math.min(width, oldData.config.width)
    const minHeight = Math.min(height, oldData.config.height)
    
    for (let y = 0; y < minHeight; y++) {
      for (let x = 0; x < minWidth; x++) {
        this.mapData.cells[y][x] = { ...oldData.cells[y][x] }
      }
    }
    
    // メタデータをコピー
    this.mapData.config.name = oldData.config.name
    this.mapData.config.description = oldData.config.description
    this.mapData.config.difficulty = oldData.config.difficulty
    
    // エディターを再構築
    this.createGrid()
    this.createCells()
    this.updateVisualCells()
    
    console.log(`📐 Map resized to ${width}x${height}`)
  }
  
  private setupEventListeners(): void {
    // グローバルなドラッグ終了の検出
    document.addEventListener('pointerup', () => {
      this.editorState.isDrawing = false
    })
  }
  
  // ゲッター
  public getMapData(): MapData {
    return this.mapData
  }
  
  public getContainer(): Container {
    return this.container
  }
  
  public getEditorState(): EditorState {
    return { ...this.editorState }
  }
  
  public getCurrentTool(): EditorTool {
    return this.editorState.currentTool
  }
  
  // セッター
  public setMapData(mapData: MapData): void {
    this.mapData = mapData
    this.createGrid()
    this.createCells()
    this.updateVisualCells()
  }
  
  public destroy(): void {
    // イベントリスナーの削除
    document.removeEventListener('pointerup', () => {
      this.editorState.isDrawing = false
    })
    
    // グラフィックスの破棄
    this.cellGraphics.forEach(row => {
      row.forEach(cellGfx => cellGfx.destroy())
    })
    
    if (this.gridGraphics) {
      this.gridGraphics.destroy()
    }
    
    this.container.destroy()
    
    console.log('🗑️ Map Editor destroyed')
  }
}