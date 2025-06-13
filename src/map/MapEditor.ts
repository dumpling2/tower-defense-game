import { Application, Graphics, Container, Text, TextStyle, FederatedPointerEvent } from 'pixi.js'
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
  private app: Application
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
  
  constructor(app: Application, initialMapData?: MapData) {
    this.app = app
    
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
        cellGfx.on('pointerdown', (event: FederatedPointerEvent) => {
          this.onCellPointerDown(x, y, event)
        })
        cellGfx.on('pointerover', (event: FederatedPointerEvent) => {
          this.onCellPointerOver(x, y, event)
        })
        cellGfx.on('pointerup', (event: FederatedPointerEvent) => {
          this.onCellPointerUp(x, y, event)
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
    let borderColor: number = 0x666666
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
  
  private onCellPointerDown(x: number, y: number, event: FederatedPointerEvent): void {
    if (this.editorState.previewMode) return
    
    this.editorState.isDrawing = true
    this.applyTool(x, y)
    
    // パス描画の場合、パスインデックスをリセット
    if (this.editorState.currentTool === 'path') {
      this.pathIndex = 0
    }
  }
  
  private onCellPointerOver(x: number, y: number, event: FederatedPointerEvent): void {
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
  
  private onCellPointerUp(x: number, y: number, event: FederatedPointerEvent): void {
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
      const prevCell = this.mapData.cells[this.lastHoveredCell.y][this.lastHoveredCell.x]\n      this.updateCellVisual(this.lastHoveredCell.x, this.lastHoveredCell.y, prevCell)\n    }\n    \n    // 新しいホバー効果\n    const cellGfx = this.cellGraphics[y][x]\n    const { cellSize } = this.mapData.config\n    \n    // ホバー時のハイライト\n    const highlight = new Graphics()\n    highlight.lineStyle(3, 0xFFFFFF, 0.8)\n    highlight.drawRect(-1, -1, cellSize + 2, cellSize + 2)\n    cellGfx.addChild(highlight)\n    \n    // 0.1秒後にハイライトを削除\n    setTimeout(() => {\n      if (highlight.parent) {\n        highlight.parent.removeChild(highlight)\n        highlight.destroy()\n      }\n    }, 100)\n  }\n  \n  private applyTool(x: number, y: number): void {\n    if (x < 0 || x >= this.mapData.config.width || y < 0 || y >= this.mapData.config.height) {\n      return\n    }\n    \n    const cell = this.mapData.cells[y][x]\n    let newType: CellType = cell.type\n    \n    switch (this.editorState.currentTool) {\n      case 'path':\n        newType = 'path'\n        cell.pathIndex = this.pathIndex++\n        break\n      case 'tower_zone':\n        newType = 'tower_zone'\n        break\n      case 'obstacle':\n        newType = 'obstacle'\n        break\n      case 'start':\n        // 既存のスタート地点をクリア\n        this.clearCellType('start')\n        newType = 'start'\n        this.mapData.startPosition = { x, y }\n        break\n      case 'end':\n        // 既存のエンド地点をクリア\n        this.clearCellType('end')\n        newType = 'end'\n        this.mapData.endPosition = { x, y }\n        break\n      case 'eraser':\n        newType = 'empty'\n        delete cell.pathIndex\n        break\n    }\n    \n    if (cell.type !== newType) {\n      cell.type = newType\n      this.updateCellVisual(x, y, cell)\n      \n      // マップの更新時刻を記録\n      this.mapData.config.updatedAt = Date.now()\n    }\n  }\n  \n  private clearCellType(type: CellType): void {\n    const { config, cells } = this.mapData\n    \n    for (let y = 0; y < config.height; y++) {\n      for (let x = 0; x < config.width; x++) {\n        if (cells[y][x].type === type) {\n          cells[y][x].type = 'empty'\n          this.updateCellVisual(x, y, cells[y][x])\n        }\n      }\n    }\n  }\n  \n  private updatePathPoints(): void {\n    const pathCells: { x: number, y: number, index: number }[] = []\n    const { config, cells } = this.mapData\n    \n    // パスセルを収集\n    for (let y = 0; y < config.height; y++) {\n      for (let x = 0; x < config.width; x++) {\n        const cell = cells[y][x]\n        if ((cell.type === 'path' || cell.type === 'start' || cell.type === 'end') && \n            cell.pathIndex !== undefined) {\n          pathCells.push({ x, y, index: cell.pathIndex })\n        }\n      }\n    }\n    \n    // インデックス順でソート\n    pathCells.sort((a, b) => a.index - b.index)\n    \n    // パスポイントを更新\n    this.mapData.pathPoints = pathCells.map(cell => {\n      const worldPos = MapDataUtils.cellToWorld(cell.x, cell.y, config.cellSize)\n      return {\n        x: worldPos.x,\n        y: worldPos.y,\n        cellX: cell.x,\n        cellY: cell.y\n      }\n    })\n    \n    console.log(`🛤️ Path updated: ${this.mapData.pathPoints.length} points`)\n  }\n  \n  // エディター制御メソッド\n  public setTool(tool: EditorTool): void {\n    this.editorState.currentTool = tool\n    console.log(`🔧 Tool changed to: ${tool}`)\n  }\n  \n  public toggleGrid(): void {\n    this.editorState.gridVisible = !this.editorState.gridVisible\n    this.gridContainer.visible = this.editorState.gridVisible\n    console.log(`🔲 Grid ${this.editorState.gridVisible ? 'shown' : 'hidden'}`)\n  }\n  \n  public togglePreviewMode(): void {\n    this.editorState.previewMode = !this.editorState.previewMode\n    \n    if (this.editorState.previewMode) {\n      // プレビューモード：エディット機能を無効化\n      this.cellContainer.eventMode = 'none'\n      console.log('👁️ Preview mode enabled')\n    } else {\n      // エディットモード：エディット機能を有効化\n      this.cellContainer.eventMode = 'auto'\n      console.log('✏️ Edit mode enabled')\n    }\n  }\n  \n  public clearMap(): void {\n    const { config, cells } = this.mapData\n    \n    for (let y = 0; y < config.height; y++) {\n      for (let x = 0; x < config.width; x++) {\n        cells[y][x].type = 'empty'\n        delete cells[y][x].pathIndex\n        this.updateCellVisual(x, y, cells[y][x])\n      }\n    }\n    \n    this.mapData.pathPoints = []\n    this.mapData.towerZones = []\n    this.pathIndex = 0\n    \n    console.log('🗑️ Map cleared')\n  }\n  \n  public generateAutoPath(): void {\n    this.clearMap()\n    \n    // 自動パス生成\n    this.mapData.pathPoints = MapDataUtils.generateStraightPath(this.mapData)\n    this.updateVisualCells()\n    \n    console.log('🤖 Auto path generated')\n  }\n  \n  public generateTowerZones(): void {\n    // 既存のタワーゾーンをクリア\n    const { config, cells } = this.mapData\n    for (let y = 0; y < config.height; y++) {\n      for (let x = 0; x < config.width; x++) {\n        if (cells[y][x].type === 'tower_zone') {\n          cells[y][x].type = 'empty'\n        }\n      }\n    }\n    \n    // 自動タワーゾーン生成\n    MapDataUtils.generateTowerZones(this.mapData)\n    this.updateVisualCells()\n    \n    console.log(`🏗️ Generated ${this.mapData.towerZones.length} tower zones`)\n  }\n  \n  public validateMap(): { valid: boolean, issues: string[] } {\n    const validation = MapDataUtils.validateMapData(this.mapData)\n    \n    console.log('✅ Map validation:')\n    console.log(`  Valid: ${validation.valid}`)\n    if (validation.issues.length > 0) {\n      console.log('  Issues:')\n      validation.issues.forEach(issue => console.log(`    - ${issue}`))\n    }\n    \n    return validation\n  }\n  \n  public exportMap(): string {\n    try {\n      const json = MapDataUtils.toJSON(this.mapData)\n      console.log('📁 Map exported to JSON')\n      return json\n    } catch (error) {\n      console.error('❌ Export failed:', error)\n      throw error\n    }\n  }\n  \n  public importMap(json: string): void {\n    try {\n      const newMapData = MapDataUtils.fromJSON(json)\n      this.mapData = newMapData\n      \n      // エディターを再構築\n      this.createGrid()\n      this.createCells()\n      this.updateVisualCells()\n      \n      console.log('📁 Map imported successfully')\n      console.log(`  Name: ${this.mapData.config.name}`)\n      console.log(`  Size: ${this.mapData.config.width}x${this.mapData.config.height}`)\n    } catch (error) {\n      console.error('❌ Import failed:', error)\n      throw error\n    }\n  }\n  \n  public resizeMap(width: number, height: number): void {\n    const oldData = this.mapData\n    this.mapData = MapDataUtils.createEmptyMap(width, height, oldData.config.cellSize)\n    \n    // 既存データを可能な限りコピー\n    const minWidth = Math.min(width, oldData.config.width)\n    const minHeight = Math.min(height, oldData.config.height)\n    \n    for (let y = 0; y < minHeight; y++) {\n      for (let x = 0; x < minWidth; x++) {\n        this.mapData.cells[y][x] = { ...oldData.cells[y][x] }\n      }\n    }\n    \n    // メタデータをコピー\n    this.mapData.config.name = oldData.config.name\n    this.mapData.config.description = oldData.config.description\n    this.mapData.config.difficulty = oldData.config.difficulty\n    \n    // エディターを再構築\n    this.createGrid()\n    this.createCells()\n    this.updateVisualCells()\n    \n    console.log(`📐 Map resized to ${width}x${height}`)\n  }\n  \n  private setupEventListeners(): void {\n    // グローバルなドラッグ終了の検出\n    document.addEventListener('pointerup', () => {\n      this.editorState.isDrawing = false\n    })\n  }\n  \n  // ゲッター\n  public getMapData(): MapData {\n    return this.mapData\n  }\n  \n  public getContainer(): Container {\n    return this.container\n  }\n  \n  public getEditorState(): EditorState {\n    return { ...this.editorState }\n  }\n  \n  public getCurrentTool(): EditorTool {\n    return this.editorState.currentTool\n  }\n  \n  // セッター\n  public setMapData(mapData: MapData): void {\n    this.mapData = mapData\n    this.createGrid()\n    this.createCells()\n    this.updateVisualCells()\n  }\n  \n  public destroy(): void {\n    // イベントリスナーの削除\n    document.removeEventListener('pointerup', () => {\n      this.editorState.isDrawing = false\n    })\n    \n    // グラフィックスの破棄\n    this.cellGraphics.forEach(row => {\n      row.forEach(cellGfx => cellGfx.destroy())\n    })\n    \n    if (this.gridGraphics) {\n      this.gridGraphics.destroy()\n    }\n    \n    this.container.destroy()\n    \n    console.log('🗑️ Map Editor destroyed')\n  }\n}