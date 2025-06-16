export interface InputState {
  mouseX: number
  mouseY: number
  isMouseDown: boolean
  keys: Set<string>
}

export class InputSystem {
  private inputState: InputState = {
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false,
    keys: new Set()
  }

  private canvas: HTMLCanvasElement
  private boundEventHandlers: {
    onMouseMove: (event: MouseEvent) => void
    onMouseDown: (event: MouseEvent) => void
    onMouseUp: (event: MouseEvent) => void
    onKeyDown: (event: KeyboardEvent) => void
    onKeyUp: (event: KeyboardEvent) => void
  }
  private isActive: boolean = true

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    
    // bound関数を保存して適切に削除できるようにする
    this.boundEventHandlers = {
      onMouseMove: this.onMouseMove.bind(this),
      onMouseDown: this.onMouseDown.bind(this),
      onMouseUp: this.onMouseUp.bind(this),
      onKeyDown: this.onKeyDown.bind(this),
      onKeyUp: this.onKeyUp.bind(this)
    }
    
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // console.log('🎮 InputSystem: Setting up event listeners')
    
    // マウス移動はcanvas内のみ（座標計算のため）
    this.canvas.addEventListener('mousemove', this.boundEventHandlers.onMouseMove)
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    
    // マウスクリックはwindow全体で監視（UIボタンも含める）
    window.addEventListener('mousedown', this.boundEventHandlers.onMouseDown)
    window.addEventListener('mouseup', this.boundEventHandlers.onMouseUp)

    // キーボードイベント
    window.addEventListener('keydown', this.boundEventHandlers.onKeyDown)
    window.addEventListener('keyup', this.boundEventHandlers.onKeyUp)
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    this.inputState.mouseX = event.clientX - rect.left
    this.inputState.mouseY = event.clientY - rect.top
  }

  private onMouseDown(event: MouseEvent): void {
    // メニューが表示されている場合はInputSystemの処理をスキップ
    if (this.isMenuVisible()) {
      // console.log('🎮 InputSystem: Skipping mouse down - menu is visible')
      return
    }
    
    // UIボタンがクリックされた場合はInputSystemの処理をスキップ
    if (this.isClickingUIElement(event)) {
      // console.log('🎮 InputSystem: Skipping mouse down - UI element clicked')
      return
    }
    
    if (!this.isActive) {
      // console.log('🎮 InputSystem: Skipping mouse down - InputSystem inactive')
      return
    }
    
    this.inputState.isMouseDown = true
    // キャンバス内のクリックのみpreventDefaultする
    if (event.target === this.canvas) {
      event.preventDefault()
    }
  }

  private onMouseUp(event: MouseEvent): void {
    // メニューが表示されている場合はInputSystemの処理をスキップ
    if (this.isMenuVisible()) {
      // console.log('🎮 InputSystem: Skipping mouse up - menu is visible')
      return
    }
    
    // UIボタンがクリックされた場合はInputSystemの処理をスキップ
    if (this.isClickingUIElement(event)) {
      // console.log('🎮 InputSystem: Skipping mouse up - UI element clicked')
      return
    }
    
    if (!this.isActive) {
      // console.log('🎮 InputSystem: Skipping mouse up - InputSystem inactive')
      return
    }
    
    this.inputState.isMouseDown = false
    // キャンバス内のクリックのみpreventDefaultする
    if (event.target === this.canvas) {
      event.preventDefault()
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    // メニューが表示されている場合は一部のキー以外をスキップ
    if (this.isMenuVisible()) {
      // メニュー用のキー（Enter、Escape）は通さない
      if (event.key === 'Enter' || event.key === 'Escape') {
        return
      }
    }
    
    if (!this.isActive) {
      return
    }
    
    this.inputState.keys.add(event.code)
  }

  private onKeyUp(event: KeyboardEvent): void {
    // メニューが表示されている場合はスキップ
    if (this.isMenuVisible()) {
      return
    }
    
    if (!this.isActive) {
      return
    }
    
    this.inputState.keys.delete(event.code)
  }

  public update(): void {
    // メニューが表示されている間は入力状態をリセット
    if (this.isMenuVisible()) {
      this.inputState.isMouseDown = false
      this.inputState.keys.clear()
    }
  }

  public getInputState(): InputState {
    return this.inputState
  }

  public isKeyPressed(keyCode: string): boolean {
    return this.inputState.keys.has(keyCode)
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this.inputState.mouseX, y: this.inputState.mouseY }
  }

  public isMouseDown(): boolean {
    return this.inputState.isMouseDown
  }

  private isMenuVisible(): boolean {
    const overlay = document.getElementById('main-menu-overlay')
    const settingsOverlay = document.getElementById('settings-menu-overlay')
    
    // より正確な表示判定
    const mainMenuVisible = overlay && 
      window.getComputedStyle(overlay).display !== 'none' && 
      window.getComputedStyle(overlay).visibility !== 'hidden'
    
    const settingsMenuVisible = settingsOverlay && 
      window.getComputedStyle(settingsOverlay).display !== 'none' &&
      window.getComputedStyle(settingsOverlay).visibility !== 'hidden'
    
    // デバッグログは無効化
    // console.log(`🎮 InputSystem: Menu visibility check:`, {
    //   mainMenuVisible,
    //   settingsMenuVisible,
    //   mainMenuDisplay: overlay ? window.getComputedStyle(overlay).display : 'element not found',
    //   settingsMenuDisplay: settingsOverlay ? window.getComputedStyle(settingsOverlay).display : 'element not found'
    // })
    
    return !!(mainMenuVisible || settingsMenuVisible)
  }

  private isClickingUIElement(event: MouseEvent): boolean {
    const target = event.target as HTMLElement
    if (!target) return false
    
    // チュートリアルが起動中かチェック
    const tutorialOverlay = document.getElementById('tutorial-overlay')
    const isTutorialActive = tutorialOverlay && window.getComputedStyle(tutorialOverlay).display !== 'none'
    
    if (isTutorialActive) {
      // console.log(`🎓 InputSystem: Tutorial is active, checking tutorial elements`)
    }
    
    // UIクラスをチェック
    const uiClasses = [
      'game-hud', 'tower-purchase-panel', 'player-control-panel',
      'purchase-btn', 'control-btn', 'tower-card', 'debug-panel',
      'tutorial-overlay', 'tutorial-panel', 'tutorial-content',
      'tutorial-nav-btn', 'tutorial-navigation', 'tutorial-highlight',
      'tutorial-close', 'tutorial-header', 'tutorial-progress',
      'tutorial-text', 'tutorial-step-indicator', 'tutorial-progress-bar',
      'tower-list', 'tower-info', 'tower-name', 'tower-stats',
      'speed-control', 'wave-control', 'speed-buttons', 'speed-btn',
      'pause-btn', 'primary', 'large', 'start-wave-btn',
      'purchase-header', 'control-section', 'control-label',
      'btn-icon', 'tower-icon'
    ]
    
    // デバッグ情報
    // デバッグログは無効化
    // console.log(`🔍 InputSystem: Checking click target:`, {
    //   tagName: target.tagName,
    //   className: target.className,
    //   id: target.id,
    //   zIndex: window.getComputedStyle(target).zIndex
    // })
    
    // 要素自体またはその親要素がUIクラスを持っているかチェック
    let element = target
    let depth = 0
    while (element && element !== document.body && depth < 10) {
      const classes = element.className || ''
      const elementId = element.id || ''
      
      // デバッグログは無効化
      // console.log(`🔍 InputSystem: Checking element at depth ${depth}:`, {
      //   tagName: element.tagName,
      //   className: classes,
      //   id: elementId,
      //   zIndex: window.getComputedStyle(element).zIndex
      // })
      
      // ボタン要素の直接チェック
      if (element.tagName === 'BUTTON') {
        // console.log(`🎮 InputSystem: Button element detected - ${element.className || element.id}`)
        return true
      }
      
      // チュートリアル要素の特別処理
      if (isTutorialActive && (
        classes.includes('tutorial') || 
        elementId.includes('tutorial') ||
        uiClasses.some(uiClass => classes.includes(uiClass))
      )) {
        // チュートリアルの暗い矩形は除外（クリックをブロックしない）
        if (classes.includes('tutorial-dark-rect')) {
          // console.log(`🎓 InputSystem: Tutorial dark rect - allowing click through`)
          return false
        }
        // console.log(`🎓 InputSystem: Tutorial UI element detected - ${element.className || element.tagName}`)
        return true
      }
      
      // 通常のUI要素チェック
      if (uiClasses.some(uiClass => classes.includes(uiClass))) {
        // console.log(`🎮 InputSystem: UI element detected - ${element.className}`)
        return true
      }
      
      // データ属性チェック（タワーカードなど）
      if (element.hasAttribute('data-tower-type') || 
          element.hasAttribute('data-speed') ||
          elementId.includes('btn') ||
          elementId.includes('button')) {
        // console.log(`🎮 InputSystem: Interactive element detected - ${element.id || element.className}`)
        return true
      }
      
      element = element.parentElement as HTMLElement
      depth++
    }
    
    // z-indexが高い要素（UIパネル）かチェック
    const styles = window.getComputedStyle(target)
    const zIndex = parseInt(styles.zIndex || '0', 10)
    if (zIndex > 100) {  // UIパネルのz-indexは通常100以上
      // console.log(`🎮 InputSystem: High z-index element detected - ${zIndex}`)
      return true
    }
    
    // console.log(`🔍 InputSystem: No UI element detected, allowing canvas interaction`)
    return false
  }
  
  public setActive(active: boolean): void {
    console.log(`🎮 InputSystem: Setting active state to ${active}`)
    this.isActive = active
  }
  
  public isInputActive(): boolean {
    return this.isActive && !this.isMenuVisible()
  }

  public destroy(): void {
    console.log('🗑️ InputSystem: Destroying and removing event listeners')
    
    // 保存された参照を使って正確に削除
    this.canvas.removeEventListener('mousemove', this.boundEventHandlers.onMouseMove)
    this.canvas.removeEventListener('mousedown', this.boundEventHandlers.onMouseDown)
    this.canvas.removeEventListener('mouseup', this.boundEventHandlers.onMouseUp)
    window.removeEventListener('keydown', this.boundEventHandlers.onKeyDown)
    window.removeEventListener('keyup', this.boundEventHandlers.onKeyUp)
    
    this.isActive = false
    console.log('✅ InputSystem: Event listeners removed')
  }
}