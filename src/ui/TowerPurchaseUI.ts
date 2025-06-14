import { GameState } from '@/game/GameState'
import { GameSystem } from '@/systems/GameSystem'
import { TowerType, TOWER_CONFIGS } from '@/entities/types/TowerTypes'

export interface TowerPlacementMode {
  isActive: boolean
  towerType: TowerType | null
  previewElement: HTMLElement | null
}

/**
 * タワー購入UI
 * 画面左側に表示される5種類のタワー購入ボタン
 */
export class TowerPurchaseUI {
  private gameState: GameState
  private gameSystem: GameSystem
  private panel: HTMLElement | null = null
  private placementMode: TowerPlacementMode = {
    isActive: false,
    towerType: null,
    previewElement: null
  }
  private updateInterval: number | null = null

  constructor(gameState: GameState, gameSystem: GameSystem) {
    this.gameState = gameState
    this.gameSystem = gameSystem
    this.createUI()
    
    // DOM要素が確実に作成された後にイベントリスナーを設定
    setTimeout(() => {
      this.setupEventListeners()
      this.startUpdating()
    }, 100)
  }

  private createUI(): void {
    const panelHTML = `
      <div id="tower-purchase-panel" class="tower-purchase-panel">
        <div class="purchase-header">
          <h3>🏗️ タワー建設</h3>
        </div>
        
        <div class="tower-list">
          <!-- ベーシックタワー -->
          <div class="tower-card" data-tower-type="basic">
            <div class="tower-icon">🏢</div>
            <div class="tower-info">
              <div class="tower-name">ベーシック</div>
              <div class="tower-stats">
                <span class="stat">💥25</span>
                <span class="stat">🎯150</span>
                <span class="stat">⚡2/s</span>
              </div>
              <div class="tower-cost">
                <span class="cost-icon">💰</span>
                <span class="cost-value">100</span>
              </div>
            </div>
            <button class="purchase-btn" id="purchase-basic">
              購入
            </button>
          </div>

          <!-- ラピッドタワー -->
          <div class="tower-card" data-tower-type="rapid">
            <div class="tower-icon">🔥</div>
            <div class="tower-info">
              <div class="tower-name">ラピッド</div>
              <div class="tower-stats">
                <span class="stat">💥15</span>
                <span class="stat">🎯120</span>
                <span class="stat">⚡6/s</span>
              </div>
              <div class="tower-cost">
                <span class="cost-icon">💰</span>
                <span class="cost-value">150</span>
              </div>
            </div>
            <button class="purchase-btn" id="purchase-rapid">
              購入
            </button>
          </div>

          <!-- ヘビータワー -->
          <div class="tower-card" data-tower-type="heavy">
            <div class="tower-icon">💣</div>
            <div class="tower-info">
              <div class="tower-name">ヘビー</div>
              <div class="tower-stats">
                <span class="stat">💥80</span>
                <span class="stat">🎯180</span>
                <span class="stat">⚡0.8/s</span>
              </div>
              <div class="tower-cost">
                <span class="cost-icon">💰</span>
                <span class="cost-value">250</span>
              </div>
            </div>
            <button class="purchase-btn" id="purchase-heavy">
              購入
            </button>
          </div>

          <!-- スナイパータワー -->
          <div class="tower-card" data-tower-type="sniper">
            <div class="tower-icon">🎯</div>
            <div class="tower-info">
              <div class="tower-name">スナイパー</div>
              <div class="tower-stats">
                <span class="stat">💥100</span>
                <span class="stat">🎯300</span>
                <span class="stat">⚡1/s</span>
              </div>
              <div class="tower-cost">
                <span class="cost-icon">💰</span>
                <span class="cost-value">300</span>
              </div>
            </div>
            <button class="purchase-btn" id="purchase-sniper">
              購入
            </button>
          </div>

          <!-- スプラッシュタワー -->
          <div class="tower-card" data-tower-type="splash">
            <div class="tower-icon">💥</div>
            <div class="tower-info">
              <div class="tower-name">スプラッシュ</div>
              <div class="tower-stats">
                <span class="stat">💥40</span>
                <span class="stat">🎯140</span>
                <span class="stat">⚡1.5/s</span>
              </div>
              <div class="tower-desc">範囲攻撃</div>
              <div class="tower-cost">
                <span class="cost-icon">💰</span>
                <span class="cost-value">200</span>
              </div>
            </div>
            <button class="purchase-btn" id="purchase-splash">
              購入
            </button>
          </div>
        </div>

        <div class="purchase-hint">
          <small>💡 購入後、マップをクリックして配置</small>
        </div>
      </div>
    `

    // HTMLを追加
    const panelContainer = document.createElement('div')
    panelContainer.innerHTML = panelHTML
    
    // 実際のパネル要素を取得
    const panel = panelContainer.querySelector('#tower-purchase-panel') as HTMLElement
    if (panel) {
      // パネルを直接body に追加
      document.body.appendChild(panel)
      this.panel = panel
      
      // パネルが確実にクリック可能になるよう追加設定
      panel.style.pointerEvents = 'auto'
      panel.style.zIndex = '1500'
      
      console.log('✅ TowerPurchaseUI panel created and added to DOM')
    } else {
      console.error('❌ Failed to create TowerPurchaseUI panel')
    }
  }

  private setupEventListeners(): void {
    // 各タワー購入ボタンのイベント
    const towerTypes: TowerType[] = ['basic', 'rapid', 'heavy', 'sniper', 'splash']
    
    towerTypes.forEach(type => {
      const btn = document.getElementById(`purchase-${type}`) as HTMLButtonElement
      if (btn) {
        // ボタンが確実にクリック可能になるよう設定
        btn.style.pointerEvents = 'auto'
        btn.style.cursor = 'pointer'
        
        // イベントリスナーを追加
        btn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log(`🏗️ ${type} tower purchase button clicked`)
          this.startPlacementMode(type)
        })
        
        console.log(`✅ Event listener added for ${type} tower button`)
      } else {
        console.error(`❌ Button not found: purchase-${type}`)
      }
    })

    // キャンセル用ESCキー
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.placementMode.isActive) {
        this.cancelPlacementMode()
      }
    })

    // マップクリックでタワー配置
    const canvas = document.querySelector('canvas')
    canvas?.addEventListener('click', (e) => this.handleCanvasClick(e))
    canvas?.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e))
  }

  private startPlacementMode(towerType: TowerType): void {
    console.log(`🎯 Starting placement mode for ${towerType} tower`)
    
    const config = TOWER_CONFIGS[towerType]
    const currentMoney = this.gameState.getMoney()
    
    console.log(`💰 Current money: ${currentMoney}, Tower cost: ${config.cost}`)
    
    if (currentMoney < config.cost) {
      console.log(`❌ Insufficient funds for ${towerType} tower`)
      this.showInsufficientFunds()
      return
    }

    this.placementMode.isActive = true
    this.placementMode.towerType = towerType
    
    console.log(`✅ Placement mode activated for ${towerType}`)
    
    // カーソルを変更
    document.body.style.cursor = 'crosshair'
    console.log('🎯 Cursor changed to crosshair')
    
    // プレビュー要素を作成
    this.createPlacementPreview()
    
    // ボタンの状態を更新
    this.updateButtonStates()
    
    console.log(`🏗️ ${towerType} tower placement mode ready`)
  }

  private cancelPlacementMode(): void {
    this.placementMode.isActive = false
    this.placementMode.towerType = null
    
    // カーソルを戻す
    document.body.style.cursor = 'default'
    
    // プレビューを削除
    if (this.placementMode.previewElement) {
      this.placementMode.previewElement.remove()
      this.placementMode.previewElement = null
    }
    
    // ボタンの状態を更新
    this.updateButtonStates()
  }

  private createPlacementPreview(): void {
    const preview = document.createElement('div')
    preview.id = 'tower-placement-preview'
    preview.className = 'tower-placement-preview'
    preview.style.display = 'none'
    document.body.appendChild(preview)
    this.placementMode.previewElement = preview
  }

  private handleCanvasClick(e: MouseEvent): void {
    if (!this.placementMode.isActive || !this.placementMode.towerType) return

    const canvas = e.target as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // タワーを配置
    const tower = this.gameSystem.createTower(x, y, this.placementMode.towerType)
    
    if (tower) {
      // 配置成功
      this.cancelPlacementMode()
    } else {
      // 配置失敗（無効な場所など）
      this.showInvalidPlacement()
    }
  }

  private handleCanvasMouseMove(e: MouseEvent): void {
    if (!this.placementMode.isActive || !this.placementMode.previewElement) return

    const preview = this.placementMode.previewElement
    preview.style.display = 'block'
    preview.style.left = e.clientX + 'px'
    preview.style.top = e.clientY + 'px'
  }

  private startUpdating(): void {
    this.updateInterval = window.setInterval(() => this.updateButtonStates(), 100)
    this.updateButtonStates()
  }

  private updateButtonStates(): void {
    const money = this.gameState.getMoney()
    const towerTypes: TowerType[] = ['basic', 'rapid', 'heavy', 'sniper', 'splash']

    towerTypes.forEach(type => {
      const btn = document.getElementById(`purchase-${type}`) as HTMLButtonElement
      const card = document.querySelector(`[data-tower-type="${type}"]`) as HTMLElement
      const config = TOWER_CONFIGS[type]

      if (btn && card) {
        if (money >= config.cost && !this.placementMode.isActive) {
          btn.disabled = false
          card.classList.remove('disabled')
        } else {
          btn.disabled = true
          card.classList.add('disabled')
        }

        // 配置モード中のハイライト
        if (this.placementMode.isActive && this.placementMode.towerType === type) {
          card.classList.add('active')
        } else {
          card.classList.remove('active')
        }
      }
    })
  }

  private showInsufficientFunds(): void {
    // 資金不足の通知
    const notification = document.createElement('div')
    notification.className = 'notification error'
    notification.textContent = '💰 資金が不足しています！'
    document.body.appendChild(notification)

    setTimeout(() => notification.remove(), 2000)
  }

  private showInvalidPlacement(): void {
    // 無効な配置場所の通知
    const notification = document.createElement('div')
    notification.className = 'notification error'
    notification.textContent = '❌ この場所には配置できません！'
    document.body.appendChild(notification)

    setTimeout(() => notification.remove(), 2000)
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.cancelPlacementMode()

    if (this.panel) {
      this.panel.remove()
      this.panel = null
    }
  }

  // デバッグ用: UI要素の状態を確認
  public debugUIState(): void {
    console.log('🔍 TowerPurchaseUI Debug State:')
    console.log('  Panel exists:', !!this.panel)
    console.log('  Panel in DOM:', !!document.getElementById('tower-purchase-panel'))
    
    const towerTypes: TowerType[] = ['basic', 'rapid', 'heavy', 'sniper', 'splash']
    towerTypes.forEach(type => {
      const btn = document.getElementById(`purchase-${type}`)
      console.log(`  ${type} button:`, {
        exists: !!btn,
        visible: btn ? window.getComputedStyle(btn).display : 'N/A',
        clickable: btn ? window.getComputedStyle(btn).pointerEvents : 'N/A',
        disabled: btn ? (btn as HTMLButtonElement).disabled : 'N/A'
      })
    })
  }

  // デバッグ用: ボタンクリックをテスト
  public testButtonClicks(): void {
    console.log('🧪 Testing TowerPurchaseUI button clicks...')
    const towerTypes: TowerType[] = ['basic', 'rapid', 'heavy', 'sniper', 'splash']
    
    towerTypes.forEach(type => {
      const btn = document.getElementById(`purchase-${type}`)
      if (btn) {
        console.log(`🔍 Testing ${type} button:`)
        console.log(`  - Element found: ✅`)
        console.log(`  - Display: ${window.getComputedStyle(btn).display}`)
        console.log(`  - Visibility: ${window.getComputedStyle(btn).visibility}`)
        console.log(`  - Pointer events: ${window.getComputedStyle(btn).pointerEvents}`)
        console.log(`  - Z-index: ${window.getComputedStyle(btn).zIndex}`)
        
        // プログラム的クリック
        console.log(`  - Triggering click...`)
        btn.click()
        
        // 手動でイベントをディスパッチ
        console.log(`  - Dispatching click event...`)
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
        btn.dispatchEvent(clickEvent)
        
        // 直接関数を呼び出し
        console.log(`  - Direct function call...`)
        this.startPlacementMode(type)
      } else {
        console.error(`❌ Button not found: purchase-${type}`)
      }
    })
  }
}