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
    this.setupEventListeners()
    this.startUpdating()
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
    document.body.appendChild(panelContainer)

    this.panel = document.getElementById('tower-purchase-panel')
  }

  private setupEventListeners(): void {
    // 各タワー購入ボタンのイベント
    const towerTypes: TowerType[] = ['basic', 'rapid', 'heavy', 'sniper', 'splash']
    
    towerTypes.forEach(type => {
      const btn = document.getElementById(`purchase-${type}`)
      btn?.addEventListener('click', () => this.startPlacementMode(type))
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
    const config = TOWER_CONFIGS[towerType]
    if (this.gameState.getMoney() < config.cost) {
      this.showInsufficientFunds()
      return
    }

    this.placementMode.isActive = true
    this.placementMode.towerType = towerType
    
    // カーソルを変更
    document.body.style.cursor = 'crosshair'
    
    // プレビュー要素を作成
    this.createPlacementPreview()
    
    // ボタンの状態を更新
    this.updateButtonStates()
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
}