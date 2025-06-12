import { Entity } from '@/entities/Entity'
import { Tower } from '@/entities/components/Tower'
import { Transform } from '@/entities/components/Transform'
import { GameState } from '@/game/GameState'
import { TowerSelectionListener } from '@/systems/TowerSelectionSystem'

export interface TowerUpgradeListener {
  onUpgrade(tower: Entity): void
  onSell(tower: Entity): void
}

/**
 * タワーアップグレードUI
 * 選択されたタワーの情報表示とアップグレード・売却機能を提供
 */
export class TowerUpgradeUI implements TowerSelectionListener {
  private gameState: GameState
  private panel: HTMLElement | null = null
  private selectedTower: Entity | null = null
  private listeners: TowerUpgradeListener[] = []
  private updateInterval: number | null = null

  constructor(gameState: GameState) {
    this.gameState = gameState
    this.createUI()
    this.setupEventListeners()
  }

  private createUI(): void {
    const panelHTML = `
      <div id="tower-upgrade-panel" class="tower-upgrade-panel hidden">
        <div class="upgrade-header">
          <h3 id="tower-name">タワー名</h3>
          <button id="close-upgrade-panel" class="close-btn">✕</button>
        </div>
        
        <div class="upgrade-content">
          <!-- タワー情報 -->
          <div class="tower-info-section">
            <h4>📊 現在の性能</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-icon">⚔️</span>
                <span class="stat-label">ダメージ:</span>
                <span id="tower-damage" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🎯</span>
                <span class="stat-label">射程:</span>
                <span id="tower-range" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">⚡</span>
                <span class="stat-label">攻撃速度:</span>
                <span id="tower-fire-rate" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🏆</span>
                <span class="stat-label">レベル:</span>
                <span id="tower-level" class="stat-value">1</span>
              </div>
            </div>
          </div>

          <!-- 統計情報 -->
          <div class="tower-stats-section">
            <h4>📈 戦績</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-icon">💀</span>
                <span class="stat-label">撃破数:</span>
                <span id="tower-kills" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">💥</span>
                <span class="stat-label">総ダメージ:</span>
                <span id="tower-total-damage" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🎯</span>
                <span class="stat-label">命中率:</span>
                <span id="tower-efficiency" class="stat-value">0%</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🔫</span>
                <span class="stat-label">発射数:</span>
                <span id="tower-shots" class="stat-value">0</span>
              </div>
            </div>
          </div>

          <!-- アップグレード情報 -->
          <div id="upgrade-info-section" class="upgrade-info-section">
            <h4>⬆️ 次のレベル</h4>
            <div class="upgrade-preview">
              <div class="upgrade-changes">
                <div class="change-item">
                  <span class="change-icon">⚔️</span>
                  <span class="change-label">ダメージ:</span>
                  <span id="upgrade-damage" class="change-value">+0</span>
                </div>
                <div class="change-item">
                  <span class="change-icon">🎯</span>
                  <span class="change-label">射程:</span>
                  <span id="upgrade-range" class="change-value">+0</span>
                </div>
                <div class="change-item">
                  <span class="change-icon">⚡</span>
                  <span class="change-label">攻撃速度:</span>
                  <span id="upgrade-fire-rate" class="change-value">+0</span>
                </div>
              </div>
              <div class="upgrade-cost">
                <span class="cost-icon">💰</span>
                <span class="cost-label">コスト:</span>
                <span id="upgrade-cost" class="cost-value">0</span>
              </div>
            </div>
          </div>

          <!-- 最大レベルメッセージ -->
          <div id="max-level-message" class="max-level-message hidden">
            <p>🏆 最大レベルに到達しました！</p>
          </div>

          <!-- アクションボタン -->
          <div class="action-buttons">
            <button id="upgrade-btn" class="action-btn upgrade-btn">
              <span class="btn-icon">⬆️</span>
              <span>アップグレード</span>
              <span id="upgrade-btn-cost" class="btn-cost">💰 0</span>
            </button>
            <button id="sell-btn" class="action-btn sell-btn">
              <span class="btn-icon">💸</span>
              <span>売却</span>
              <span id="sell-btn-value" class="btn-cost">💰 0</span>
            </button>
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

    this.panel = document.getElementById('tower-upgrade-panel')
  }

  private getStyles(): string {
    return `
      .tower-upgrade-panel {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 360px;
        background: rgba(20, 25, 35, 0.95);
        border: 1px solid rgba(70, 90, 120, 0.6);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        color: #e8f4f8;
        z-index: 1000;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tower-upgrade-panel.hidden {
        opacity: 0;
        visibility: hidden;
        transform: translateX(-50%) translateY(20px);
      }

      .upgrade-header {
        background: rgba(30, 40, 55, 0.9);
        padding: 16px 20px;
        border-bottom: 1px solid rgba(70, 90, 120, 0.6);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 12px 12px 0 0;
      }

      .upgrade-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #00d4ff;
      }

      .close-btn {
        background: none;
        border: none;
        color: #a0b4c0;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ff4757;
      }

      .upgrade-content {
        padding: 20px;
      }

      .tower-info-section,
      .tower-stats-section,
      .upgrade-info-section {
        margin-bottom: 20px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
      }

      .tower-info-section h4,
      .tower-stats-section h4,
      .upgrade-info-section h4 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 600;
        color: #00d4ff;
        border-bottom: 1px solid rgba(70, 90, 120, 0.4);
        padding-bottom: 6px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .stat-icon {
        font-size: 14px;
      }

      .stat-label {
        color: #a0b4c0;
        font-size: 11px;
        flex: 1;
      }

      .stat-value {
        font-weight: 600;
        color: #e8f4f8;
      }

      .upgrade-preview {
        background: rgba(0, 212, 255, 0.05);
        border: 1px solid rgba(0, 212, 255, 0.2);
        border-radius: 6px;
        padding: 12px;
      }

      .upgrade-changes {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .change-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .change-icon {
        font-size: 20px;
      }

      .change-label {
        font-size: 10px;
        color: #a0b4c0;
      }

      .change-value {
        font-weight: 600;
        color: #00ff88;
      }

      .upgrade-cost {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 212, 255, 0.2);
      }

      .cost-icon {
        font-size: 16px;
      }

      .cost-label {
        color: #a0b4c0;
      }

      .cost-value {
        font-weight: 600;
        font-size: 14px;
        color: #ffb800;
      }

      .max-level-message {
        text-align: center;
        padding: 20px;
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 8px;
      }

      .max-level-message p {
        margin: 0;
        font-size: 14px;
        color: #00ff88;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .action-btn {
        background: linear-gradient(135deg, #666, #555);
        border: 1px solid #666;
        color: #e8f4f8;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .action-btn:active {
        transform: translateY(0);
      }

      .upgrade-btn {
        background: linear-gradient(135deg, #00d4ff, #0099cc);
        border-color: #00d4ff;
      }

      .upgrade-btn:disabled {
        background: linear-gradient(135deg, #666, #555);
        border-color: #666;
        opacity: 0.5;
        cursor: not-allowed;
      }

      .sell-btn {
        background: linear-gradient(135deg, #ff4757, #cc3344);
        border-color: #ff4757;
      }

      .btn-icon {
        font-size: 24px;
      }

      .btn-cost {
        font-size: 11px;
        opacity: 0.8;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      .tower-upgrade-panel:not(.hidden) {
        animation: slideUp 0.3s ease-out;
      }
    `
  }

  private setupEventListeners(): void {
    // 閉じるボタン
    document.getElementById('close-upgrade-panel')?.addEventListener('click', () => {
      this.hide()
    })

    // アップグレードボタン
    document.getElementById('upgrade-btn')?.addEventListener('click', () => {
      if (this.selectedTower) {
        this.handleUpgrade()
      }
    })

    // 売却ボタン
    document.getElementById('sell-btn')?.addEventListener('click', () => {
      if (this.selectedTower) {
        this.handleSell()
      }
    })
  }

  public onTowerSelected(tower: Entity): void {
    this.selectedTower = tower
    this.show()
    this.updateDisplay()
    
    // 定期的に統計を更新
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    this.updateInterval = window.setInterval(() => {
      this.updateDisplay()
    }, 1000)
  }

  public onTowerDeselected(): void {
    this.hide()
    this.selectedTower = null
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  private updateDisplay(): void {
    if (!this.selectedTower || !this.panel) return

    const tower = this.selectedTower.getComponent<Tower>('tower')
    const transform = this.selectedTower.getComponent<Transform>('transform')
    if (!tower || !transform) return

    // タワー名
    this.updateElement('tower-name', `${tower.getConfig().name} (Lv.${tower.getLevel()})`)

    // 現在の性能
    this.updateElement('tower-damage', tower.getDamage().toString())
    this.updateElement('tower-range', Math.round(tower.getRange()).toString())
    this.updateElement('tower-fire-rate', `${tower.getFireRate().toFixed(1)}/秒`)
    this.updateElement('tower-level', tower.getLevel().toString())

    // 戦績
    this.updateElement('tower-kills', tower.getTotalKills().toString())
    this.updateElement('tower-total-damage', tower.getTotalDamageDealt().toString())
    this.updateElement('tower-efficiency', `${tower.getEfficiency().toFixed(1)}%`)
    this.updateElement('tower-shots', tower.getTotalShotsFired().toString())

    // アップグレード情報
    if (tower.canUpgrade()) {
      this.showUpgradeInfo(tower)
    } else {
      this.showMaxLevelMessage()
    }

    // 売却価値
    const sellValue = tower.getSellValue()
    this.updateElement('sell-btn-value', `💰 ${sellValue}`)

    // アップグレードボタンの状態
    this.updateUpgradeButton(tower)
  }

  private showUpgradeInfo(tower: Tower): void {
    const upgradeInfo = tower.getUpgradeInfo()
    if (!upgradeInfo) return

    // アップグレード後の変化を表示
    this.updateElement('upgrade-damage', `+${upgradeInfo.damageIncrease}`)
    this.updateElement('upgrade-range', `+${upgradeInfo.rangeIncrease}`)
    this.updateElement('upgrade-fire-rate', `+${upgradeInfo.fireRateIncrease.toFixed(1)}`)
    this.updateElement('upgrade-cost', upgradeInfo.cost.toString())

    // セクションの表示切り替え
    document.getElementById('upgrade-info-section')?.classList.remove('hidden')
    document.getElementById('max-level-message')?.classList.add('hidden')
  }

  private showMaxLevelMessage(): void {
    document.getElementById('upgrade-info-section')?.classList.add('hidden')
    document.getElementById('max-level-message')?.classList.remove('hidden')
  }

  private updateUpgradeButton(tower: Tower): void {
    const upgradeBtn = document.getElementById('upgrade-btn') as HTMLButtonElement
    if (!upgradeBtn) return

    if (tower.canUpgrade()) {
      const upgradeInfo = tower.getUpgradeInfo()
      if (upgradeInfo) {
        const canAfford = this.gameState.getMoney() >= upgradeInfo.cost
        upgradeBtn.disabled = !canAfford
        this.updateElement('upgrade-btn-cost', `💰 ${upgradeInfo.cost}`)
      }
    } else {
      upgradeBtn.disabled = true
      this.updateElement('upgrade-btn-cost', '最大レベル')
    }
  }

  private handleUpgrade(): void {
    if (!this.selectedTower) return

    const tower = this.selectedTower.getComponent<Tower>('tower')
    if (!tower || !tower.canUpgrade()) return

    const upgradeInfo = tower.getUpgradeInfo()
    if (!upgradeInfo) return

    // 資金チェック
    if (this.gameState.getMoney() < upgradeInfo.cost) {
      console.warn('💰 資金不足でアップグレードできません')
      return
    }

    // リスナーに通知
    for (const listener of this.listeners) {
      listener.onUpgrade(this.selectedTower)
    }
  }

  private handleSell(): void {
    if (!this.selectedTower) return

    // リスナーに通知
    for (const listener of this.listeners) {
      listener.onSell(this.selectedTower)
    }

    // UIを閉じる
    this.hide()
  }

  private updateElement(id: string, value: string): void {
    const element = document.getElementById(id)
    if (element) {
      element.textContent = value
    }
  }

  private show(): void {
    if (this.panel) {
      this.panel.classList.remove('hidden')
    }
  }

  private hide(): void {
    if (this.panel) {
      this.panel.classList.add('hidden')
    }
  }

  public addListener(listener: TowerUpgradeListener): void {
    this.listeners.push(listener)
  }

  public removeListener(listener: TowerUpgradeListener): void {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) {
      this.listeners.splice(index, 1)
    }
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    
    if (this.panel) {
      this.panel.remove()
    }
    
    this.listeners = []
  }
}