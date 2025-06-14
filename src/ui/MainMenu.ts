export class MainMenu {
  private overlay!: HTMLElement
  private onStartGame: () => void
  private onSettings: () => void
  private onExit: () => void
  private onTutorial: (() => void) | undefined
  private eventListenersAttached: boolean = false

  constructor(onStartGame: () => void, onSettings: () => void, onExit: () => void, onTutorial?: () => void) {
    this.onStartGame = onStartGame
    this.onSettings = onSettings
    this.onExit = onExit
    this.onTutorial = onTutorial
    
    // 即座にDOM要素を作成（初期化完了を保証）
    this.overlay = this.createMenuElement()
    console.log('🏗️ MainMenu created successfully')
    
    // デバッグ情報を遅延で表示してDOMの初期化を確認
    setTimeout(() => {
      this.performDetailedDebug()
    }, 2000)
  }

  private createMenuElement(): HTMLElement {
    console.log('🔧 Creating MainMenu DOM element...')
    
    // 既存のメニューをクリーンアップ
    const existingOverlay = document.getElementById('main-menu-overlay')
    if (existingOverlay) {
      console.log('🗑️ Removing existing menu overlay...')
      existingOverlay.remove()
    }
    
    // オーバーレイ要素を作成
    const overlay = document.createElement('div')
    overlay.id = 'main-menu-overlay'
    overlay.className = 'main-menu-overlay'
    
    // 背景要素
    const background = document.createElement('div')
    background.className = 'main-menu-background'
    
    // 背景アニメーション
    const bgAnimation = document.createElement('div')
    bgAnimation.className = 'menu-bg-animation'
    
    for (let i = 1; i <= 3; i++) {
      const tower = document.createElement('div')
      tower.className = `floating-tower tower-${i}`
      bgAnimation.appendChild(tower)
    }
    
    // メインコンテンツ
    const content = document.createElement('div')
    content.className = 'main-menu-content'
    
    // タイトル
    const title = document.createElement('div')
    title.className = 'game-title'
    title.innerHTML = `
      <h1>🏰 タワーディフェンス</h1>
      <p class="game-subtitle">戦略的多様タワーシステム</p>
    `
    
    // ボタンコンテナ
    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'menu-buttons'
    
    // ゲーム開始ボタン
    const startBtn = this.createButton('start-game-btn', 'menu-btn primary', '🎮', 'ゲーム開始', () => {
      console.log('🎮 Start button clicked!')
      this.playClickSound()
      this.onStartGame()
    })
    
    // チュートリアルボタン
    const tutorialBtn = this.createButton('tutorial-btn', 'menu-btn tutorial', '🎓', 'チュートリアル', () => {
      console.log('🎓 Tutorial button clicked!')
      this.playClickSound()
      if (this.onTutorial) {
        this.onTutorial()
      }
    })
    
    // 設定ボタン
    const settingsBtn = this.createButton('settings-btn', 'menu-btn secondary', '⚙️', '設定', () => {
      console.log('⚙️ Settings button clicked!')
      this.playClickSound()
      this.onSettings()
    })
    
    // 終了ボタン
    const exitBtn = this.createButton('exit-btn', 'menu-btn secondary', '🚪', '終了', () => {
      console.log('🚪 Exit button clicked!')
      this.playClickSound()
      this.onExit()
    })
    
    buttonContainer.appendChild(startBtn)
    buttonContainer.appendChild(tutorialBtn)
    buttonContainer.appendChild(settingsBtn)
    buttonContainer.appendChild(exitBtn)
    
    // ゲーム情報
    const gameInfo = document.createElement('div')
    gameInfo.className = 'game-info'
    gameInfo.innerHTML = `
      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">🚀</span>
          <span>1000発同時ミサイル処理</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🏗️</span>
          <span>5種類戦略的タワー</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">👹</span>
          <span>5種類敵タイプ・ボスウェーブ</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">⚡</span>
          <span>高性能最適化システム</span>
        </div>
      </div>
    `
    
    // バージョン情報
    const versionInfo = document.createElement('div')
    versionInfo.className = 'version-info'
    versionInfo.innerHTML = '<span>Version 1.0.0 | TypeScript + PixiJS + Vite</span>'
    
    // 要素を組み立て
    content.appendChild(title)
    content.appendChild(buttonContainer)
    content.appendChild(gameInfo)
    content.appendChild(versionInfo)
    
    background.appendChild(bgAnimation)
    background.appendChild(content)
    overlay.appendChild(background)
    
    // bodyに直接追加して、追加成功を確認
    try {
      document.body.appendChild(overlay)
      console.log('✅ MainMenu overlay successfully added to body')
    } catch (error) {
      console.error('❌ Failed to add overlay to body:', error)
      throw error
    }
    
    // DOM要素が実際に追加されたか確認
    const verifyElement = document.getElementById('main-menu-overlay')
    if (!verifyElement) {
      console.error('❌ Overlay was not properly added to DOM!')
      throw new Error('Failed to add overlay to DOM')
    }
    
    // キーボードイベントリスナーを設定
    this.setupKeyboardListeners()
    
    console.log('✅ MainMenu DOM element created and verified')
    
    return overlay
  }

  private createButton(id: string, className: string, icon: string, text: string, onClick: () => void): HTMLElement {
    console.log(`🔧 Creating button: ${id}`)
    
    const button = document.createElement('button')
    button.id = id
    button.className = className
    
    // 強制的にクリック可能にする属性を追加
    button.style.pointerEvents = 'auto'
    button.style.cursor = 'pointer'
    button.style.userSelect = 'none'
    button.style.position = 'relative'
    button.style.zIndex = '50005'
    button.setAttribute('tabindex', '0')
    button.setAttribute('role', 'button')
    
    const iconSpan = document.createElement('span')
    iconSpan.className = 'btn-icon'
    iconSpan.textContent = icon
    iconSpan.style.pointerEvents = 'none' // 子要素がクリックを阻害しないように
    
    const textSpan = document.createElement('span')
    textSpan.className = 'btn-text'
    textSpan.textContent = text
    textSpan.style.pointerEvents = 'none' // 子要素がクリックを阻害しないように
    
    button.appendChild(iconSpan)
    button.appendChild(textSpan)
    
    // より堅牢なイベントリスナー設定
    const clickHandler = (event: Event) => {
      console.log(`🎯 Button ${id} clicked! Event type: ${event.type}`)
      console.log('Event details:', {
        target: event.target,
        currentTarget: event.currentTarget,
        bubbles: event.bubbles,
        cancelable: event.cancelable
      })
      
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      
      try {
        onClick()
        console.log(`✅ Button ${id} callback executed successfully`)
      } catch (error) {
        console.error(`❌ Error executing callback for ${id}:`, error)
      }
    }
    
    // 複数のイベントタイプでリスナーを設定
    button.addEventListener('click', clickHandler, { capture: false, passive: false })
    button.addEventListener('mousedown', (e) => {
      console.log(`🖱️ Button ${id} mousedown detected`)
      e.preventDefault()
    })
    button.addEventListener('mouseup', (e) => {
      console.log(`🖱️ Button ${id} mouseup detected`)
      e.preventDefault()
    })
    
    // ホバーエフェクト
    button.addEventListener('mouseenter', () => {
      console.log(`👀 Button ${id} hovered`)
      button.style.backgroundColor = '#27ae60' // 視覚的フィードバック
    })
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '' // リセット
    })
    
    // キーボードサポート
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        console.log(`⌨️ Button ${id} activated via keyboard`)
        event.preventDefault()
        clickHandler(event)
      }
    })
    
    // タッチサポート
    button.addEventListener('touchstart', (event) => {
      console.log(`📱 Button ${id} touched`)
      event.preventDefault()
    })
    
    button.addEventListener('touchend', (event) => {
      console.log(`📱 Button ${id} touch ended`)
      event.preventDefault()
      clickHandler(event)
    })
    
    console.log(`✅ Button ${id} created with all event listeners`)
    this.eventListenersAttached = true
    
    return button
  }

  private setupKeyboardListeners(): void {
    const keyboardHandler = (event: KeyboardEvent) => {
      if (this.isVisible()) {
        switch (event.key) {
          case 'Enter':
            console.log('Enter key pressed - starting game')
            this.onStartGame()
            break
          case 'Escape':
            console.log('Escape key pressed - exiting game')
            this.onExit()
            break
        }
      }
    }
    
    document.addEventListener('keydown', keyboardHandler)
  }

  private playClickSound(): void {
    // 将来的にサウンドシステム実装時に使用
    console.log('🔊 Menu click sound')
  }

  public show(): void {
    console.log('📱 Showing MainMenu...')
    
    if (!this.overlay) {
      console.error('❌ MainMenu overlay not found! Attempting to recreate...')
      this.overlay = this.createMenuElement()
    }
    
    if (this.overlay) {
      console.log('📍 MainMenu overlay found, displaying...')
      this.overlay.style.display = 'flex'
      
      // 少し遅延してフェードイン（CSS transition用）
      requestAnimationFrame(() => {
        if (this.overlay) {
          this.overlay.classList.add('fade-in')
          console.log('✅ MainMenu shown with fade-in')
        }
      })
    } else {
      console.error('❌ Failed to create MainMenu overlay!')
    }
  }

  public hide(): void {
    console.log('🙈 Hiding MainMenu...')
    
    if (this.overlay) {
      this.overlay.classList.add('fade-out')
      
      setTimeout(() => {
        this.overlay.style.display = 'none'
        this.overlay.classList.remove('fade-in', 'fade-out')
        console.log('✅ MainMenu hidden')
      }, 300)
    }
  }

  public isVisible(): boolean {
    return this.overlay ? this.overlay.style.display !== 'none' : false
  }

  public testButtonClicks(): void {
    console.log('🧪 Testing button click functionality...')
    
    const startBtn = document.getElementById('start-game-btn')
    const settingsBtn = document.getElementById('settings-btn')
    const exitBtn = document.getElementById('exit-btn')
    
    console.log('Button availability:')
    console.log('  - Start button:', !!startBtn, startBtn?.offsetWidth, 'x', startBtn?.offsetHeight)
    console.log('  - Settings button:', !!settingsBtn, settingsBtn?.offsetWidth, 'x', settingsBtn?.offsetHeight)
    console.log('  - Exit button:', !!exitBtn, exitBtn?.offsetWidth, 'x', exitBtn?.offsetHeight)
    
    if (startBtn) {
      const rect = startBtn.getBoundingClientRect()
      const styles = window.getComputedStyle(startBtn)
      
      console.log('Start button detailed info:', {
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        visible: rect.width > 0 && rect.height > 0 && styles.display !== 'none',
        pointerEvents: styles.pointerEvents,
        cursor: styles.cursor,
        zIndex: styles.zIndex,
        opacity: styles.opacity,
        transform: styles.transform,
        overflow: styles.overflow
      })
      
      // プログラム的にクリックをテスト
      console.log('🖱️ Simulating click on start button...')
      startBtn.click()
      
      // 追加テスト: マウスイベントを直接発火
      console.log('🖱️ Simulating mouse events...')
      const mouseDownEvent = new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      })
      const mouseUpEvent = new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      })
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      })
      
      startBtn.dispatchEvent(mouseDownEvent)
      startBtn.dispatchEvent(mouseUpEvent)
      startBtn.dispatchEvent(clickEvent)
    }
  }
  
  public performDetailedDebug(): void {
    console.log('🔍 === DETAILED MENU DEBUG START ===')
    
    console.log('Event listeners attached:', this.eventListenersAttached)
    console.log('Overlay element:', !!this.overlay)
    
    if (this.overlay) {
      console.log('Overlay display:', this.overlay.style.display)
      console.log('Overlay classes:', this.overlay.className)
      
      const overlayRect = this.overlay.getBoundingClientRect()
      console.log('Overlay position:', overlayRect)
    }
    
    // すべてのボタンを詳細チェック
    const buttons = ['start-game-btn', 'settings-btn', 'exit-btn']
    buttons.forEach(buttonId => {
      const btn = document.getElementById(buttonId)
      if (btn) {
        const rect = btn.getBoundingClientRect()
        const styles = window.getComputedStyle(btn)
        console.log(`Button ${buttonId}:`, {
          exists: true,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          styles: {
            display: styles.display,
            visibility: styles.visibility,
            pointerEvents: styles.pointerEvents,
            zIndex: styles.zIndex,
            position: styles.position,
            opacity: styles.opacity
          },
          listeners: this.getEventListeners(btn)
        })
      } else {
        console.log(`Button ${buttonId}: NOT FOUND`)
      }
    })
    
    // DOM階層のチェック
    this.checkDOMHierarchy()
    
    // 競合する要素のチェック
    this.checkConflictingElements()
    
    console.log('🔍 === DETAILED MENU DEBUG END ===')
  }
  
  private getEventListeners(element: HTMLElement): string[] {
    // この関数は実際にはリスナーを取得できませんが、存在確認用
    const listeners = []
    if (element.onclick) listeners.push('onclick')
    if (element.onmousedown) listeners.push('onmousedown')
    if (element.onmouseup) listeners.push('onmouseup')
    return listeners
  }
  
  private checkDOMHierarchy(): void {
    console.log('📋 DOM Hierarchy Check:')
    const overlay = document.getElementById('main-menu-overlay')
    if (overlay) {
      console.log('  Overlay parent:', overlay.parentElement?.tagName)
      console.log('  Overlay children count:', overlay.children.length)
      
      const buttons = overlay.querySelectorAll('button')
      console.log('  Buttons found in overlay:', buttons.length)
      buttons.forEach((btn, index) => {
        console.log(`    Button ${index}:`, btn.id, btn.className)
      })
    }
  }
  
  private checkConflictingElements(): void {
    console.log('⚠️ Checking for conflicting elements:')
    
    // 高いz-indexを持つ要素をチェック
    const allElements = document.querySelectorAll('*')
    const highZIndexElements: HTMLElement[] = []
    
    allElements.forEach(el => {
      const styles = window.getComputedStyle(el as HTMLElement)
      const zIndex = parseInt(styles.zIndex)
      if (zIndex > 15000) {
        highZIndexElements.push(el as HTMLElement)
      }
    })
    
    console.log('Elements with z-index > 15000:', highZIndexElements.length)
    highZIndexElements.forEach(el => {
      console.log('  High z-index element:', {
        tag: el.tagName,
        id: el.id,
        class: el.className,
        zIndex: window.getComputedStyle(el).zIndex
      })
    })
    
    // pointer-events: none以外の全画面要素をチェック
    const fullScreenElements = document.querySelectorAll('*')
    fullScreenElements.forEach(el => {
      const styles = window.getComputedStyle(el as HTMLElement)
      const rect = el.getBoundingClientRect()
      
      if (rect.width >= window.innerWidth * 0.8 && 
          rect.height >= window.innerHeight * 0.8 && 
          styles.pointerEvents !== 'none') {
        console.log('  Potential blocking element:', {
          tag: el.tagName,
          id: (el as HTMLElement).id,
          class: (el as HTMLElement).className,
          pointerEvents: styles.pointerEvents,
          zIndex: styles.zIndex
        })
      }
    })
  }
  
  public enableDebugMode(): void {
    console.log('🔧 Debug mode enabled')
    
    // ボタンに視覚的なデバッグボーダーを追加
    const buttons = ['start-game-btn', 'settings-btn', 'exit-btn']
    buttons.forEach(buttonId => {
      const btn = document.getElementById(buttonId)
      if (btn) {
        btn.style.border = '3px solid #ff0000'
        btn.style.boxShadow = '0 0 10px #ff0000'
      }
    })
    
    // オーバーレイにもデバッグボーダーを追加
    if (this.overlay) {
      this.overlay.style.border = '5px solid #00ff00'
    }
  }

  public destroy(): void {
    console.log('🗑️ Destroying MainMenu...')
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
      console.log('✅ MainMenu removed from DOM')
    }
  }
}