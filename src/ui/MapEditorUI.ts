import { MapEditor, EditorTool } from '@/map/MapEditor'
import { MapDataUtils } from '@/map/MapData'

/**
 * マップエディターUI
 * ツール選択・マップ操作・インポート/エクスポート機能
 */
export class MapEditorUI {
  private mapEditor: MapEditor
  private panel: HTMLElement | null = null
  private isVisible = false

  constructor(mapEditor: MapEditor) {
    this.mapEditor = mapEditor
    this.createUI()
    this.setupEventListeners()
    this.updateToolButtons()
  }

  private createUI(): void {
    const panelHTML = `
      <div id="map-editor-panel" class="map-editor-panel hidden">
        <div class="editor-header">
          <h3>🗺️ マップエディター</h3>
          <button id="close-editor-panel" class="close-btn">✕</button>
        </div>
        
        <div class="editor-content">
          <!-- マップ情報 -->
          <div class="map-info-section">
            <h4>📋 マップ情報</h4>
            <div class="info-grid">
              <div class="info-item">
                <label for="map-name">名前:</label>
                <input type="text" id="map-name" class="map-input" maxlength="50">
              </div>
              <div class="info-item">
                <label for="map-description">説明:</label>
                <textarea id="map-description" class="map-textarea" rows="2" maxlength="200"></textarea>
              </div>
              <div class="info-item">
                <label for="map-difficulty">難易度:</label>
                <select id="map-difficulty" class="map-select">
                  <option value="easy">簡単</option>
                  <option value="medium">普通</option>
                  <option value="hard">難しい</option>
                  <option value="expert">エキスパート</option>
                </select>
              </div>
              <div class="info-item">
                <label for="map-max-towers">最大タワー数:</label>
                <input type="number" id="map-max-towers" class="map-input" min="1" max="50">
              </div>
            </div>
          </div>

          <!-- ツール選択 -->
          <div class="tools-section">
            <h4>🔧 編集ツール</h4>
            <div class="tools-grid">
              <button id="tool-path" class="tool-btn" data-tool="path">
                <span class="tool-icon">🛤️</span>
                <span class="tool-label">パス</span>
              </button>
              <button id="tool-start" class="tool-btn" data-tool="start">
                <span class="tool-icon">🚀</span>
                <span class="tool-label">開始点</span>
              </button>
              <button id="tool-end" class="tool-btn" data-tool="end">
                <span class="tool-icon">🏁</span>
                <span class="tool-label">終了点</span>
              </button>
              <button id="tool-tower_zone" class="tool-btn" data-tool="tower_zone">
                <span class="tool-icon">🏗️</span>
                <span class="tool-label">タワーゾーン</span>
              </button>
              <button id="tool-obstacle" class="tool-btn" data-tool="obstacle">
                <span class="tool-icon">🧱</span>
                <span class="tool-label">障害物</span>
              </button>
              <button id="tool-eraser" class="tool-btn" data-tool="eraser">
                <span class="tool-icon">🧽</span>
                <span class="tool-label">消しゴム</span>
              </button>
            </div>
          </div>

          <!-- ビュー設定 -->
          <div class="view-section">
            <h4>👁️ 表示設定</h4>
            <div class="view-controls">
              <button id="toggle-grid" class="control-btn">
                <span class="control-icon">🔲</span>
                <span>グリッド表示切替</span>
              </button>
              <button id="toggle-preview" class="control-btn">
                <span class="control-icon">👁️</span>
                <span>プレビューモード</span>
              </button>
            </div>
          </div>

          <!-- 自動生成機能 -->
          <div class="auto-section">
            <h4>🤖 自動生成</h4>
            <div class="auto-controls">
              <button id="generate-auto-path" class="auto-btn">
                <span class="auto-icon">🛤️</span>
                <span>自動パス生成</span>
              </button>
              <button id="generate-tower-zones" class="auto-btn">
                <span class="auto-icon">🏗️</span>
                <span>タワーゾーン生成</span>
              </button>
              <button id="clear-map" class="auto-btn danger">
                <span class="auto-icon">🗑️</span>
                <span>マップクリア</span>
              </button>
            </div>
          </div>

          <!-- マップ操作 -->
          <div class="map-actions-section">
            <h4>📁 マップ操作</h4>
            <div class="actions-grid">
              <div class="action-group">
                <h5>サイズ変更</h5>
                <div class="size-controls">
                  <input type="number" id="map-width" class="size-input" placeholder="幅" min="5" max="50">
                  <input type="number" id="map-height" class="size-input" placeholder="高さ" min="5" max="50">
                  <button id="resize-map" class="action-btn">リサイズ</button>
                </div>
              </div>
              
              <div class="action-group">
                <h5>インポート/エクスポート</h5>
                <div class="file-controls">
                  <button id="export-map" class="action-btn">📤 エクスポート</button>
                  <button id="import-map" class="action-btn">📥 インポート</button>
                  <input type="file" id="import-file" accept=".json" style="display: none;">
                </div>
              </div>
            </div>
          </div>

          <!-- バリデーション -->
          <div class="validation-section">
            <h4>✅ マップ検証</h4>
            <button id="validate-map" class="validate-btn">マップを検証</button>
            <div id="validation-results" class="validation-results"></div>
          </div>

          <!-- デフォルトマップ -->
          <div class="default-maps-section">
            <h4>📦 デフォルトマップ</h4>
            <div class="default-maps-list">
              <button id="load-straight-map" class="default-map-btn">ストレートライン</button>
              <button id="load-lshape-map" class="default-map-btn">L字コース</button>
            </div>
          </div>

          <!-- 統計情報 -->
          <div class="stats-section">
            <h4>📊 統計</h4>
            <div id="map-stats" class="map-stats">
              <div class="stat-item">
                <span class="stat-label">パス長:</span>
                <span id="stat-path-length" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">タワーゾーン:</span>
                <span id="stat-tower-zones" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最終更新:</span>
                <span id="stat-last-updated" class="stat-value">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // CSSスタイルを追加
    const styleElement = document.createElement('style')
    styleElement.textContent = this.getStyles()
    document.head.appendChild(styleElement)

    // HTMLをドキュメントに追加
    const panelContainer = document.createElement('div')
    panelContainer.innerHTML = panelHTML
    document.body.appendChild(panelContainer)

    this.panel = document.getElementById('map-editor-panel')
    this.updateMapInfo()
    this.updateStats()
  }

  private getStyles(): string {
    return `
      .map-editor-panel {
        position: fixed;
        top: 50%;
        left: 20px;
        transform: translateY(-50%);
        width: 380px;
        max-height: 90vh;
        background: rgba(15, 20, 30, 0.95);
        border: 1px solid rgba(70, 90, 120, 0.6);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 11px;
        color: #e8f4f8;
        z-index: 1000;
        backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      .map-editor-panel.hidden {
        opacity: 0;
        visibility: hidden;
        transform: translateY(-50%) translateX(-20px);
      }

      .editor-header {
        background: rgba(30, 40, 55, 0.9);
        padding: 16px 20px;
        border-bottom: 1px solid rgba(70, 90, 120, 0.6);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 12px 12px 0 0;
      }

      .editor-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #00d4ff;
      }

      .close-btn {
        background: none;
        border: none;
        color: #a0b4c0;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ff4757;
      }

      .editor-content {
        padding: 16px;
        max-height: calc(90vh - 60px);
        overflow-y: auto;
      }

      .map-info-section,
      .tools-section,
      .view-section,
      .auto-section,
      .map-actions-section,
      .validation-section,
      .default-maps-section,
      .stats-section {
        margin-bottom: 16px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
      }

      .map-info-section h4,
      .tools-section h4,
      .view-section h4,
      .auto-section h4,
      .map-actions-section h4,
      .validation-section h4,
      .default-maps-section h4,
      .stats-section h4 {
        margin: 0 0 10px 0;
        font-size: 12px;
        font-weight: 600;
        color: #00d4ff;
        border-bottom: 1px solid rgba(0, 212, 255, 0.3);
        padding-bottom: 4px;
      }

      .info-grid {
        display: grid;
        gap: 8px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-item label {
        font-size: 10px;
        color: #a0b4c0;
        font-weight: 500;
      }

      .map-input,
      .map-select,
      .map-textarea {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #e8f4f8;
        padding: 6px 8px;
        font-size: 11px;
        font-family: inherit;
      }

      .map-input:focus,
      .map-select:focus,
      .map-textarea:focus {
        outline: none;
        border-color: #00d4ff;
        background: rgba(255, 255, 255, 0.08);
      }

      .tools-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }

      .tool-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #e8f4f8;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        font-size: 10px;
      }

      .tool-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .tool-btn.active {
        background: rgba(0, 212, 255, 0.2);
        border-color: #00d4ff;
        color: #00d4ff;
      }

      .tool-icon {
        font-size: 16px;
      }

      .tool-label {
        font-size: 9px;
        text-align: center;
      }

      .view-controls,
      .auto-controls {
        display: grid;
        gap: 6px;
      }

      .control-btn,
      .auto-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #e8f4f8;
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
      }

      .control-btn:hover,
      .auto-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .auto-btn.danger {
        border-color: rgba(255, 71, 87, 0.3);
        color: #ff4757;
      }

      .auto-btn.danger:hover {
        background: rgba(255, 71, 87, 0.1);
        border-color: #ff4757;
      }

      .control-icon,
      .auto-icon {
        font-size: 14px;
      }

      .actions-grid {
        display: grid;
        gap: 12px;
      }

      .action-group h5 {
        margin: 0 0 6px 0;
        font-size: 11px;
        color: #a0b4c0;
      }

      .size-controls,
      .file-controls {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 4px;
        align-items: end;
      }

      .file-controls {
        grid-template-columns: 1fr 1fr;
      }

      .size-input {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #e8f4f8;
        padding: 6px 8px;
        font-size: 10px;
        font-family: inherit;
        text-align: center;
      }

      .action-btn {
        background: rgba(0, 212, 255, 0.2);
        border: 1px solid rgba(0, 212, 255, 0.5);
        border-radius: 4px;
        color: #00d4ff;
        padding: 6px 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 10px;
        font-weight: 600;
      }

      .action-btn:hover {
        background: rgba(0, 212, 255, 0.3);
        border-color: #00d4ff;
      }

      .validate-btn {
        width: 100%;
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid rgba(0, 255, 136, 0.5);
        border-radius: 6px;
        color: #00ff88;
        padding: 10px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 11px;
        font-weight: 600;
      }

      .validate-btn:hover {
        background: rgba(0, 255, 136, 0.3);
        border-color: #00ff88;
      }

      .validation-results {
        margin-top: 8px;
        padding: 8px;
        border-radius: 4px;
        font-size: 10px;
        line-height: 1.4;
      }

      .validation-results.valid {
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        color: #00ff88;
      }

      .validation-results.invalid {
        background: rgba(255, 71, 87, 0.1);
        border: 1px solid rgba(255, 71, 87, 0.3);
        color: #ff4757;
      }

      .default-maps-list {
        display: grid;
        gap: 6px;
      }

      .default-map-btn {
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 6px;
        color: #FFD700;
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 11px;
      }

      .default-map-btn:hover {
        background: rgba(255, 215, 0, 0.2);
        border-color: #FFD700;
      }

      .map-stats {
        display: grid;
        gap: 4px;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .stat-label {
        font-size: 10px;
        color: #a0b4c0;
      }

      .stat-value {
        font-size: 10px;
        color: #e8f4f8;
        font-weight: 600;
      }

      /* スクロールバーのスタイリング */
      .editor-content::-webkit-scrollbar {
        width: 6px;
      }

      .editor-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      .editor-content::-webkit-scrollbar-thumb {
        background: rgba(0, 212, 255, 0.3);
        border-radius: 3px;
      }

      .editor-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 212, 255, 0.5);
      }
    `
  }

  private setupEventListeners(): void {
    // 閉じるボタン
    document.getElementById('close-editor-panel')?.addEventListener('click', () => {
      this.hide()
    })

    // ツール選択
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        const tool = target.dataset.tool as EditorTool
        if (tool) {
          this.mapEditor.setTool(tool)
          this.updateToolButtons()
        }
      })
    })

    // ビュー制御
    document.getElementById('toggle-grid')?.addEventListener('click', () => {
      this.mapEditor.toggleGrid()
    })

    document.getElementById('toggle-preview')?.addEventListener('click', () => {
      this.mapEditor.togglePreviewMode()
    })

    // 自動生成
    document.getElementById('generate-auto-path')?.addEventListener('click', () => {
      this.mapEditor.generateAutoPath()
      this.updateStats()
    })

    document.getElementById('generate-tower-zones')?.addEventListener('click', () => {
      this.mapEditor.generateTowerZones()
      this.updateStats()
    })

    document.getElementById('clear-map')?.addEventListener('click', () => {
      if (confirm('マップをクリアしますか？この操作は取り消せません。')) {
        this.mapEditor.clearMap()
        this.updateStats()
      }
    })

    // マップ情報の更新
    document.getElementById('map-name')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      const mapData = this.mapEditor.getMapData()
      mapData.config.name = target.value
      mapData.config.updatedAt = Date.now()
      this.updateStats()
    })

    document.getElementById('map-description')?.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement
      const mapData = this.mapEditor.getMapData()
      mapData.config.description = target.value
      mapData.config.updatedAt = Date.now()
    })

    document.getElementById('map-difficulty')?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement
      const mapData = this.mapEditor.getMapData()
      mapData.config.difficulty = target.value as any
      mapData.config.updatedAt = Date.now()
    })

    document.getElementById('map-max-towers')?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      const mapData = this.mapEditor.getMapData()
      mapData.config.maxTowers = parseInt(target.value) || 1
      mapData.config.updatedAt = Date.now()
    })

    // マップサイズ変更
    document.getElementById('resize-map')?.addEventListener('click', () => {
      const widthInput = document.getElementById('map-width') as HTMLInputElement
      const heightInput = document.getElementById('map-height') as HTMLInputElement
      
      const width = parseInt(widthInput.value) || 20
      const height = parseInt(heightInput.value) || 15
      
      if (width >= 5 && width <= 50 && height >= 5 && height <= 50) {
        this.mapEditor.resizeMap(width, height)
        this.updateMapInfo()
        this.updateStats()
      } else {
        alert('マップサイズは5x5から50x50の範囲で設定してください')
      }
    })

    // エクスポート/インポート
    document.getElementById('export-map')?.addEventListener('click', () => {
      this.exportMap()
    })

    document.getElementById('import-map')?.addEventListener('click', () => {
      document.getElementById('import-file')?.click()
    })

    document.getElementById('import-file')?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (file) {
        this.importMap(file)
      }
    })

    // バリデーション
    document.getElementById('validate-map')?.addEventListener('click', () => {
      this.validateMap()
    })

    // デフォルトマップ
    document.getElementById('load-straight-map')?.addEventListener('click', () => {
      this.loadDefaultMap(0)
    })

    document.getElementById('load-lshape-map')?.addEventListener('click', () => {
      this.loadDefaultMap(1)
    })

    // キーボードショートカット（M キーでマップエディター表示/非表示）
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault()
        this.toggle()
      }
    })
  }

  private updateToolButtons(): void {
    const currentTool = this.mapEditor.getCurrentTool()
    
    document.querySelectorAll('.tool-btn').forEach(btn => {
      const tool = (btn as HTMLElement).dataset.tool
      if (tool === currentTool) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })
  }

  private updateMapInfo(): void {
    const mapData = this.mapEditor.getMapData()
    
    this.updateElement('map-name', mapData.config.name)
    this.updateElement('map-description', mapData.config.description)
    this.updateSelectValue('map-difficulty', mapData.config.difficulty)
    this.updateElement('map-max-towers', mapData.config.maxTowers.toString())
    
    // サイズ入力フィールドにも現在のサイズを表示
    this.updateElement('map-width', mapData.config.width.toString())
    this.updateElement('map-height', mapData.config.height.toString())
  }

  private updateStats(): void {
    const mapData = this.mapEditor.getMapData()
    
    this.updateElement('stat-path-length', mapData.pathPoints.length.toString())
    this.updateElement('stat-tower-zones', mapData.towerZones.length.toString())
    
    const lastUpdated = new Date(mapData.config.updatedAt).toLocaleString()
    this.updateElement('stat-last-updated', lastUpdated)
  }

  private validateMap(): void {
    const validation = this.mapEditor.validateMap()
    const resultsElement = document.getElementById('validation-results')
    
    if (!resultsElement) return
    
    resultsElement.className = `validation-results ${validation.valid ? 'valid' : 'invalid'}`
    
    if (validation.valid) {
      resultsElement.textContent = '✅ マップは有効です！'
    } else {
      resultsElement.innerHTML = `
        ❌ マップに問題があります:<br>
        ${validation.issues.map(issue => `• ${issue}`).join('<br>')}
      `
    }
  }

  private exportMap(): void {
    try {
      const json = this.mapEditor.exportMap()
      const mapData = this.mapEditor.getMapData()
      
      // ファイルとしてダウンロード
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${mapData.config.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('マップが正常にエクスポートされました！')
    } catch (error) {
      alert(`エクスポートに失敗しました: ${error}`)
    }
  }

  private importMap(file: File): void {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        this.mapEditor.importMap(json)
        this.updateMapInfo()
        this.updateStats()
        
        alert('マップが正常にインポートされました！')
      } catch (error) {
        alert(`インポートに失敗しました: ${error}`)
      }
    }
    
    reader.readAsText(file)
  }

  private loadDefaultMap(index: number): void {
    try {
      const defaultMaps = MapDataUtils.getDefaultMaps()
      if (index >= 0 && index < defaultMaps.length) {
        this.mapEditor.setMapData(defaultMaps[index])
        this.updateMapInfo()
        this.updateStats()
        
        console.log(`📦 Loaded default map: ${defaultMaps[index].config.name}`)
      }
    } catch (error) {
      alert(`デフォルトマップの読み込みに失敗しました: ${error}`)
    }
  }

  private updateElement(id: string, value: string): void {
    const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement
    if (element) {
      element.value = value
    }
  }

  private updateSelectValue(id: string, value: string): void {
    const select = document.getElementById(id) as HTMLSelectElement
    if (select) {
      select.value = value
    }
  }

  public show(): void {
    if (this.panel) {
      this.panel.classList.remove('hidden')
      this.isVisible = true
      this.updateMapInfo()
      this.updateStats()
    }
  }

  public hide(): void {
    if (this.panel) {
      this.panel.classList.add('hidden')
      this.isVisible = false
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  public destroy(): void {
    if (this.panel) {
      this.panel.remove()
    }
  }
}