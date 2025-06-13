import { EconomySystem, CurrencyType, Investment, UpgradeBonus } from '@/game/EconomySystem'

/**
 * 経済システムUI
 * 通貨表示・投資・アップグレード管理
 */
export class EconomyUI {
  private economySystem: EconomySystem
  private panel: HTMLElement | null = null
  private isVisible = false

  constructor(economySystem: EconomySystem) {
    this.economySystem = economySystem
    this.createUI()
    this.setupEventListeners()
    this.updateDisplay()
  }

  private createUI(): void {
    const panelHTML = `
      <div id="economy-panel" class="economy-panel hidden">
        <div class="economy-header">
          <h3>💰 経済管理システム</h3>
          <button id="close-economy-panel" class="close-btn">✕</button>
        </div>
        
        <div class="economy-content">
          <!-- 通貨表示 -->
          <div class="currency-section">
            <h4>💎 通貨状況</h4>
            <div class="currency-grid">
              <div class="currency-item">
                <span class="currency-icon">🪙</span>
                <span class="currency-label">ゴールド:</span>
                <span id="currency-gold" class="currency-value">0</span>
                <span id="income-gold" class="income-rate">(+0/秒)</span>
              </div>
              <div class="currency-item">
                <span class="currency-icon">💎</span>
                <span class="currency-label">クリスタル:</span>
                <span id="currency-crystal" class="currency-value">0</span>
                <span id="income-crystal" class="income-rate">(+0/秒)</span>
              </div>
              <div class="currency-item">
                <span class="currency-icon">🔬</span>
                <span class="currency-label">研究:</span>
                <span id="currency-research" class="currency-value">0</span>
                <span id="income-research" class="income-rate">(+0/秒)</span>
              </div>
              <div class="currency-item">
                <span class="currency-icon">⚡</span>
                <span class="currency-label">エネルギー:</span>
                <span id="currency-energy" class="currency-value">0</span>
                <span id="income-energy" class="income-rate">(+0/秒)</span>
              </div>
            </div>
          </div>

          <!-- 倍率表示 -->
          <div class="multipliers-section">
            <h4>📈 現在の倍率</h4>
            <div class="multipliers-grid">
              <div class="multiplier-item">
                <span class="multiplier-icon">⚔️</span>
                <span class="multiplier-label">ダメージ:</span>
                <span id="multiplier-damage" class="multiplier-value">100%</span>
              </div>
              <div class="multiplier-item">
                <span class="multiplier-icon">🎯</span>
                <span class="multiplier-label">射程:</span>
                <span id="multiplier-range" class="multiplier-value">100%</span>
              </div>
              <div class="multiplier-item">
                <span class="multiplier-icon">⚡</span>
                <span class="multiplier-label">攻撃速度:</span>
                <span id="multiplier-firerate" class="multiplier-value">100%</span>
              </div>
              <div class="multiplier-item">
                <span class="multiplier-icon">💰</span>
                <span class="multiplier-label">収入:</span>
                <span id="multiplier-income" class="multiplier-value">100%</span>
              </div>
            </div>
          </div>

          <!-- タブシステム -->
          <div class="tab-system">
            <div class="tab-buttons">
              <button id="tab-investments" class="tab-btn active">🏭 投資</button>
              <button id="tab-upgrades" class="tab-btn">⬆️ アップグレード</button>
            </div>

            <!-- 投資タブ -->
            <div id="investments-tab" class="tab-content active">
              <div class="section-header">
                <h4>🏭 投資機会</h4>
                <span class="section-subtitle">パッシブ収入と一時投資</span>
              </div>
              <div id="investments-list" class="investments-list"></div>
              
              <div class="active-investments">
                <h5>📊 進行中の投資</h5>
                <div id="active-investments-list" class="active-list"></div>
              </div>
            </div>

            <!-- アップグレードタブ -->
            <div id="upgrades-tab" class="tab-content hidden">
              <div class="section-header">
                <h4>⬆️ 技術アップグレード</h4>
                <span class="section-subtitle">永続的な性能向上</span>
              </div>
              <div id="upgrades-list" class="upgrades-list"></div>
              
              <div class="purchased-upgrades">
                <h5>✅ 購入済みアップグレード</h5>
                <div id="purchased-upgrades-list" class="purchased-list"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- フローティング通貨表示 -->
      <div id="floating-currency" class="floating-currency">
        <div class="floating-currency-item">
          <span class="currency-icon">🪙</span>
          <span id="floating-gold" class="currency-value">0</span>
        </div>
        <div class="floating-currency-item">
          <span class="currency-icon">💎</span>
          <span id="floating-crystal" class="currency-value">0</span>
        </div>
        <div class="floating-currency-item">
          <span class="currency-icon">🔬</span>
          <span id="floating-research" class="currency-value">0</span>
        </div>
        <div class="floating-currency-item">
          <span class="currency-icon">⚡</span>
          <span id="floating-energy" class="currency-value">0</span>
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

    this.panel = document.getElementById('economy-panel')
  }

  private getStyles(): string {
    return `
      .economy-panel {
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        width: 420px;
        max-height: 80vh;
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

      .economy-panel.hidden {
        opacity: 0;
        visibility: hidden;
        transform: translateY(-50%) translateX(20px);
      }

      .economy-header {
        background: rgba(30, 40, 55, 0.9);
        padding: 16px 20px;
        border-bottom: 1px solid rgba(70, 90, 120, 0.6);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 12px 12px 0 0;
      }

      .economy-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #FFD700;
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

      .economy-content {
        padding: 16px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .currency-section,
      .multipliers-section {
        margin-bottom: 16px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
      }

      .currency-section h4,
      .multipliers-section h4 {
        margin: 0 0 10px 0;
        font-size: 12px;
        font-weight: 600;
        color: #FFD700;
        border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        padding-bottom: 4px;
      }

      .currency-grid,
      .multipliers-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }

      .currency-item,
      .multiplier-item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 6px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .currency-icon,
      .multiplier-icon {
        font-size: 12px;
        width: 16px;
      }

      .currency-label,
      .multiplier-label {
        color: #a0b4c0;
        font-size: 10px;
        flex: 1;
      }

      .currency-value,
      .multiplier-value {
        font-weight: 600;
        color: #e8f4f8;
        font-size: 10px;
      }

      .income-rate {
        font-size: 9px;
        color: #00ff88;
        margin-left: 4px;
      }

      .tab-system {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        overflow: hidden;
      }

      .tab-buttons {
        display: flex;
        background: rgba(255, 255, 255, 0.05);
      }

      .tab-btn {
        flex: 1;
        background: none;
        border: none;
        color: #a0b4c0;
        padding: 10px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }

      .tab-btn.active {
        color: #FFD700;
        background: rgba(255, 215, 0, 0.1);
        border-bottom-color: #FFD700;
      }

      .tab-btn:hover:not(.active) {
        background: rgba(255, 255, 255, 0.05);
      }

      .tab-content {
        padding: 12px;
      }

      .tab-content.hidden {
        display: none;
      }

      .section-header {
        margin-bottom: 12px;
      }

      .section-header h4 {
        margin: 0 0 4px 0;
        font-size: 12px;
        color: #FFD700;
      }

      .section-subtitle {
        font-size: 9px;
        color: #a0b4c0;
      }

      .investment-item,
      .upgrade-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 8px;
        margin-bottom: 8px;
        transition: all 0.2s;
      }

      .investment-item:hover,
      .upgrade-item:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 215, 0, 0.3);
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .item-name {
        font-weight: 600;
        color: #e8f4f8;
        font-size: 11px;
      }

      .item-description {
        font-size: 9px;
        color: #a0b4c0;
        margin-bottom: 6px;
        line-height: 1.3;
      }

      .item-cost {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
      }

      .cost-item {
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: 9px;
        color: #ffb800;
      }

      .invest-btn,
      .upgrade-btn {
        width: 100%;
        background: linear-gradient(135deg, #FFD700, #FFA500);
        border: none;
        color: #000;
        padding: 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .invest-btn:hover,
      .upgrade-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
      }

      .invest-btn:disabled,
      .upgrade-btn:disabled {
        background: linear-gradient(135deg, #666, #555);
        color: #a0b4c0;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .active-investment-item {
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 6px;
        padding: 6px;
        margin-bottom: 6px;
      }

      .investment-progress {
        margin-top: 4px;
      }

      .progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff88, #00d4ff);
        transition: width 0.3s;
      }

      .progress-text {
        font-size: 8px;
        color: #00ff88;
        margin-top: 2px;
      }

      .purchased-upgrade-item {
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 6px;
        padding: 6px;
        margin-bottom: 6px;
      }

      .purchased-upgrade-item .item-name {
        color: #00ff88;
      }

      .floating-currency {
        position: fixed;
        top: 20px;
        left: 20px;
        display: flex;
        gap: 12px;
        z-index: 1001;
        pointer-events: none;
      }

      .floating-currency-item {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(15, 20, 30, 0.9);
        border: 1px solid rgba(255, 215, 0, 0.6);
        border-radius: 6px;
        padding: 6px 8px;
        backdrop-filter: blur(10px);
      }

      .floating-currency-item .currency-icon {
        font-size: 14px;
      }

      .floating-currency-item .currency-value {
        font-weight: 600;
        color: #e8f4f8;
        font-size: 12px;
        min-width: 40px;
        text-align: right;
      }

      /* スクロールバーのスタイリング */
      .economy-content::-webkit-scrollbar {
        width: 6px;
      }

      .economy-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      .economy-content::-webkit-scrollbar-thumb {
        background: rgba(255, 215, 0, 0.3);
        border-radius: 3px;
      }

      .economy-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 215, 0, 0.5);
      }
    `
  }

  private setupEventListeners(): void {
    // 閉じるボタン
    document.getElementById('close-economy-panel')?.addEventListener('click', () => {
      this.hide()
    })

    // タブ切り替え
    document.getElementById('tab-investments')?.addEventListener('click', () => {
      this.switchTab('investments')
    })

    document.getElementById('tab-upgrades')?.addEventListener('click', () => {
      this.switchTab('upgrades')
    })

    // キーボードショートカット（E キーで経済パネル表示/非表示）
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault()
        this.toggle()
      }
    })
  }

  private switchTab(tabName: string): void {
    // タブボタンの状態更新
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'))
    document.getElementById(`tab-${tabName}`)?.classList.add('active')

    // タブコンテンツの表示切り替え
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'))
    document.getElementById(`${tabName}-tab`)?.classList.remove('hidden')
  }

  public show(): void {
    if (this.panel) {
      this.panel.classList.remove('hidden')
      this.isVisible = true
      this.updateDisplay()
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

  public updateDisplay(): void {
    this.updateCurrencies()
    this.updateMultipliers()
    this.updateInvestments()
    this.updateUpgrades()
    this.updateFloatingCurrency()
  }

  private updateCurrencies(): void {
    const currencies = this.economySystem.getAllCurrencies()
    const passiveIncome = this.economySystem.getPassiveIncome()

    // メインパネル
    this.updateElement('currency-gold', currencies.gold.toLocaleString())
    this.updateElement('currency-crystal', currencies.crystal.toLocaleString())
    this.updateElement('currency-research', currencies.research.toLocaleString())
    this.updateElement('currency-energy', currencies.energy.toLocaleString())

    this.updateElement('income-gold', `(+${passiveIncome.gold.toFixed(1)}/秒)`)
    this.updateElement('income-crystal', `(+${passiveIncome.crystal.toFixed(1)}/秒)`)
    this.updateElement('income-research', `(+${passiveIncome.research.toFixed(1)}/秒)`)
    this.updateElement('income-energy', `(+${passiveIncome.energy.toFixed(1)}/秒)`)
  }

  private updateMultipliers(): void {
    const multipliers = this.economySystem.getMultipliers()

    this.updateElement('multiplier-damage', `${Math.round(multipliers.damage * 100)}%`)
    this.updateElement('multiplier-range', `${Math.round(multipliers.range * 100)}%`)
    this.updateElement('multiplier-firerate', `${Math.round(multipliers.fireRate * 100)}%`)
    this.updateElement('multiplier-income', `${Math.round(multipliers.income * 100)}%`)
  }

  private updateInvestments(): void {
    const investmentsList = document.getElementById('investments-list')
    const activeInvestmentsList = document.getElementById('active-investments-list')
    
    if (!investmentsList || !activeInvestmentsList) return

    // 利用可能な投資
    const availableInvestments = this.economySystem.getAvailableInvestments()
    investmentsList.innerHTML = ''

    for (const investment of availableInvestments) {
      const investmentElement = this.createInvestmentElement(investment)
      investmentsList.appendChild(investmentElement)
    }

    // アクティブな投資
    const activeInvestments = this.economySystem.getActiveInvestments()
    activeInvestmentsList.innerHTML = ''

    for (const investment of activeInvestments) {
      const activeElement = this.createActiveInvestmentElement(investment)
      activeInvestmentsList.appendChild(activeElement)
    }
  }

  private updateUpgrades(): void {
    const upgradesList = document.getElementById('upgrades-list')
    const purchasedUpgradesList = document.getElementById('purchased-upgrades-list')
    
    if (!upgradesList || !purchasedUpgradesList) return

    // 利用可能なアップグレード
    const availableUpgrades = this.economySystem.getAvailableUpgrades()
    upgradesList.innerHTML = ''

    for (const upgrade of availableUpgrades) {
      const upgradeElement = this.createUpgradeElement(upgrade)
      upgradesList.appendChild(upgradeElement)
    }

    // 購入済みアップグレード
    const purchasedUpgrades = this.economySystem.getPurchasedUpgrades()
    purchasedUpgradesList.innerHTML = ''

    for (const upgrade of purchasedUpgrades) {
      const purchasedElement = this.createPurchasedUpgradeElement(upgrade)
      purchasedUpgradesList.appendChild(purchasedElement)
    }
  }

  private updateFloatingCurrency(): void {
    const currencies = this.economySystem.getAllCurrencies()

    this.updateElement('floating-gold', currencies.gold.toLocaleString())
    this.updateElement('floating-crystal', currencies.crystal.toLocaleString())
    this.updateElement('floating-research', currencies.research.toLocaleString())
    this.updateElement('floating-energy', currencies.energy.toLocaleString())
  }

  private createInvestmentElement(investment: Investment): HTMLElement {
    const element = document.createElement('div')
    element.className = 'investment-item'

    const costElements = Object.entries(investment.cost)
      .filter(([_, amount]) => amount && amount > 0)
      .map(([type, amount]) => {
        const icon = this.getCurrencyIcon(type as CurrencyType)
        return `<span class="cost-item">${icon}${amount}</span>`
      }).join('')

    const returnsText = investment.duration > 0 
      ? `${investment.duration}秒後に受け取り`
      : '永続効果'

    element.innerHTML = `
      <div class="item-header">
        <span class="item-name">${investment.name}</span>
      </div>
      <div class="item-description">${investment.description}</div>
      <div class="item-cost">${costElements}</div>
      <div style="font-size: 9px; color: #00ff88; margin-bottom: 6px;">${returnsText}</div>
      <button class="invest-btn" data-investment-id="${investment.id}">投資する</button>
    `

    const button = element.querySelector('.invest-btn') as HTMLButtonElement
    button.addEventListener('click', () => {
      if (this.economySystem.investIn(investment.id)) {
        this.updateDisplay()
      }
    })

    // コストチェックしてボタンの有効/無効を設定
    const canAfford = this.canAffordCost(investment.cost)
    button.disabled = !canAfford

    return element
  }

  private createActiveInvestmentElement(investment: Investment): HTMLElement {
    const element = document.createElement('div')
    element.className = 'active-investment-item'

    const elapsed = (Date.now() - investment.startTime) / 1000
    const progress = Math.min(elapsed / investment.duration, 1) * 100
    const remaining = Math.max(investment.duration - elapsed, 0)

    element.innerHTML = `
      <div class="item-name">${investment.name}</div>
      <div class="investment-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-text">残り ${remaining.toFixed(1)}秒</div>
      </div>
    `

    return element
  }

  private createUpgradeElement(upgrade: UpgradeBonus): HTMLElement {
    const element = document.createElement('div')
    element.className = 'upgrade-item'

    const costElements = Object.entries(upgrade.cost)
      .filter(([_, amount]) => amount && amount > 0)
      .map(([type, amount]) => {
        const icon = this.getCurrencyIcon(type as CurrencyType)
        return `<span class="cost-item">${icon}${amount}</span>`
      }).join('')

    element.innerHTML = `
      <div class="item-header">
        <span class="item-name">${upgrade.name}</span>
      </div>
      <div class="item-description">${upgrade.description}</div>
      <div class="item-cost">${costElements}</div>
      <button class="upgrade-btn" data-upgrade-id="${upgrade.id}">購入</button>
    `

    const button = element.querySelector('.upgrade-btn') as HTMLButtonElement
    button.addEventListener('click', () => {
      if (this.economySystem.purchaseUpgrade(upgrade.id)) {
        this.updateDisplay()
      }
    })

    // コストチェックしてボタンの有効/無効を設定
    const canAfford = this.canAffordCost(upgrade.cost)
    button.disabled = !canAfford

    return element
  }

  private createPurchasedUpgradeElement(upgrade: UpgradeBonus): HTMLElement {
    const element = document.createElement('div')
    element.className = 'purchased-upgrade-item'

    element.innerHTML = `
      <div class="item-name">✅ ${upgrade.name}</div>
      <div class="item-description">${upgrade.description}</div>
    `

    return element
  }

  private canAffordCost(cost: Partial<{ gold: number; crystal: number; research: number; energy: number }>): boolean {
    const currencies = this.economySystem.getAllCurrencies()
    
    for (const [type, amount] of Object.entries(cost)) {
      if (amount && currencies[type as CurrencyType] < amount) {
        return false
      }
    }
    
    return true
  }

  private getCurrencyIcon(type: CurrencyType): string {
    const icons = {
      gold: '🪙',
      crystal: '💎',
      research: '🔬',
      energy: '⚡'
    }
    return icons[type]
  }

  private updateElement(id: string, value: string): void {
    const element = document.getElementById(id)
    if (element) {
      element.textContent = value
    }
  }

  public destroy(): void {
    if (this.panel) {
      this.panel.remove()
    }
  }
}