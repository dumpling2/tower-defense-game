import { TutorialStep } from './TutorialSystem'

/**
 * チュートリアルUIクラス
 * オーバーレイ、ハイライト、ナビゲーション機能を提供
 */
export class TutorialUI {
  private overlay: HTMLElement | null = null
  private maskOverlay: HTMLElement | null = null  // 新しい黒いマスクオーバーレイ
  private highlightBox: HTMLElement | null = null
  private contentPanel: HTMLElement | null = null
  private navigationPanel: HTMLElement | null = null
  private currentStep: TutorialStep | null = null
  private currentStepIndex = 0
  private totalSteps = 0
  private isVisible = false

  // イベントハンドラー
  private onNext: (() => void) | undefined
  private onPrevious: (() => void) | undefined
  private onSkip: (() => void) | undefined
  private onClose: (() => void) | undefined

  constructor() {
    this.createUI()
    this.setupEventListeners()
    console.log('🎨 TutorialUI initialized')
  }

  /**
   * UI要素を作成
   */
  private createUI(): void {
    // メインオーバーレイ（全体のコンテナ）
    this.overlay = document.createElement('div')
    this.overlay.id = 'tutorial-overlay'
    this.overlay.className = 'tutorial-overlay hidden'

    // 黒いマスクオーバーレイ（穴を開けるための要素）
    this.maskOverlay = document.createElement('div')
    this.maskOverlay.id = 'tutorial-mask-overlay'
    this.maskOverlay.className = 'tutorial-mask-overlay'

    // ハイライトボックス
    this.highlightBox = document.createElement('div')
    this.highlightBox.id = 'tutorial-highlight'
    this.highlightBox.className = 'tutorial-highlight'

    // コンテンツパネル
    this.contentPanel = document.createElement('div')
    this.contentPanel.id = 'tutorial-content'
    this.contentPanel.className = 'tutorial-content'

    // ナビゲーションパネル
    this.navigationPanel = document.createElement('div')
    this.navigationPanel.id = 'tutorial-navigation'
    this.navigationPanel.className = 'tutorial-navigation'

    // 構造を組み立て
    this.overlay.appendChild(this.maskOverlay)
    this.overlay.appendChild(this.highlightBox)
    this.overlay.appendChild(this.contentPanel)
    this.overlay.appendChild(this.navigationPanel)

    // CSSスタイルを追加
    this.injectStyles()

    // DOMに追加
    document.body.appendChild(this.overlay)
  }

  /**
   * スタイルを注入
   */
  private injectStyles(): void {
    const styleElement = document.createElement('style')
    styleElement.id = 'tutorial-styles'
    styleElement.textContent = `
      /* チュートリアルオーバーレイ（コンテナ） */
      .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        pointer-events: none;  /* コンテナ自体はクリックを通す */
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 1;
        visibility: visible;
      }

      /* 黒いマスクオーバーレイ */
      .tutorial-mask-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        pointer-events: auto;  /* マスクはクリックをブロック */
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10001;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
      }

      .tutorial-overlay.hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      /* ハイライトボックス */
      .tutorial-highlight {
        position: absolute;
        border: 4px solid #00d4ff;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 
          0 0 0 3px rgba(0, 212, 255, 0.8),
          0 0 30px rgba(0, 212, 255, 1.0),
          0 0 50px rgba(0, 212, 255, 0.6),
          inset 0 0 50px rgba(255, 255, 255, 0.15),
          inset 0 0 0 2px rgba(255, 255, 255, 0.3);
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        animation: tutorialPulse 2s infinite ease-in-out;
        z-index: 10001;
        backdrop-filter: brightness(1.3) contrast(1.1);
        -webkit-backdrop-filter: brightness(1.3) contrast(1.1);
      }

      .tutorial-highlight.hidden {
        opacity: 0;
        transform: scale(0.8);
      }

      @keyframes tutorialPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 
            0 0 0 3px rgba(0, 212, 255, 0.8),
            0 0 30px rgba(0, 212, 255, 1.0),
            0 0 50px rgba(0, 212, 255, 0.6),
            inset 0 0 50px rgba(255, 255, 255, 0.15),
            inset 0 0 0 2px rgba(255, 255, 255, 0.3);
          border-color: #00d4ff;
          backdrop-filter: brightness(1.3) contrast(1.1);
        }
        50% {
          transform: scale(1.03);
          box-shadow: 
            0 0 0 6px rgba(0, 212, 255, 1.0),
            0 0 50px rgba(0, 212, 255, 1.0),
            0 0 80px rgba(0, 212, 255, 0.8),
            inset 0 0 60px rgba(255, 255, 255, 0.25),
            inset 0 0 0 3px rgba(255, 255, 255, 0.5);
          border-color: #1ae0ff;
          backdrop-filter: brightness(1.5) contrast(1.2);
        }
      }

      /* コンテンツパネル */
      .tutorial-content {
        position: absolute;
        min-width: 360px;
        max-width: 520px;
        background: linear-gradient(145deg, rgba(10, 20, 35, 0.98), rgba(15, 25, 40, 0.98));
        border: 2px solid rgba(0, 212, 255, 0.5);
        border-radius: 20px;
        padding: 28px;
        box-shadow: 
          0 20px 60px rgba(0, 0, 0, 0.8),
          0 0 0 1px rgba(255, 255, 255, 0.15),
          0 0 30px rgba(0, 212, 255, 0.3);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        z-index: 10002;
        pointer-events: auto !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #f0f8fc;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tutorial-content.position-center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .tutorial-content.position-top {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .tutorial-content.position-bottom {
        bottom: 140px;
        left: 50%;
        transform: translateX(-50%);
      }

      .tutorial-content.position-left {
        top: 50%;
        left: 20px;
        transform: translateY(-50%);
      }

      .tutorial-content.position-right {
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
      }

      /* コンテンツヘッダー */
      .tutorial-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(0, 212, 255, 0.2);
      }

      .tutorial-title {
        font-size: 22px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        text-shadow: 
          0 2px 8px rgba(0, 212, 255, 0.6),
          0 0 20px rgba(0, 212, 255, 0.4);
        line-height: 1.3;
        flex: 1;
        margin-right: 16px;
      }

      .tutorial-close {
        background: none;
        border: none;
        color: #a0b4c0;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.2s ease;
        line-height: 1;
      }

      .tutorial-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ff4757;
        transform: scale(1.1);
      }

      /* コンテンツ本文 */
      .tutorial-text {
        font-size: 16px;
        line-height: 1.7;
        color: #ffffff;
        margin-bottom: 24px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      }

      .tutorial-text strong {
        color: #00d4ff;
        font-weight: 700;
        text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      }

      .tutorial-text kbd {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 2px 6px;
        font-family: monospace;
        font-size: 13px;
        color: #00ff88;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      /* 進行状況表示 */
      .tutorial-progress {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        padding: 14px 18px;
        background: rgba(0, 212, 255, 0.08);
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 12px;
        box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
      }

      .tutorial-step-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #a0b4c0;
      }

      .tutorial-step-number {
        background: #00d4ff;
        color: #0a1420;
        font-weight: 700;
        font-size: 12px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tutorial-progress-bar {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }

      .tutorial-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d4ff, #0099cc);
        border-radius: 3px;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
      }

      /* ナビゲーションパネル */
      .tutorial-navigation {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        z-index: 10003;
        pointer-events: auto !important;
      }

      .tutorial-nav-btn {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e8f4f8;
        border-radius: 10px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        pointer-events: auto !important;
        z-index: 10004;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
        overflow: hidden;
      }

      .tutorial-nav-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }

      .tutorial-nav-btn:hover::before {
        left: 100%;
      }

      .tutorial-nav-btn:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }

      .tutorial-nav-btn:active {
        transform: translateY(0);
      }

      .tutorial-nav-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
      }

      .tutorial-nav-btn:disabled:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        border-color: rgba(255, 255, 255, 0.2);
        transform: none;
        box-shadow: none;
      }

      .tutorial-nav-btn.primary {
        background: linear-gradient(135deg, #00d4ff, #0099cc);
        border-color: #00d4ff;
        color: #0a1420;
        font-weight: 700;
      }

      .tutorial-nav-btn.primary:hover {
        background: linear-gradient(135deg, #1ae0ff, #00b8e6);
        border-color: #1ae0ff;
        box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);
      }

      .tutorial-nav-btn.skip {
        background: linear-gradient(135deg, rgba(255, 68, 68, 0.2), rgba(255, 68, 68, 0.1));
        border-color: rgba(255, 68, 68, 0.4);
        color: #ff4757;
      }

      .tutorial-nav-btn.skip:hover {
        background: linear-gradient(135deg, rgba(255, 68, 68, 0.3), rgba(255, 68, 68, 0.2));
        border-color: rgba(255, 68, 68, 0.6);
        box-shadow: 0 8px 24px rgba(255, 68, 68, 0.3);
      }

      /* アイコン */
      .tutorial-icon {
        font-size: 16px;
      }

      /* 完了メッセージ */
      .tutorial-completion {
        text-align: center;
        padding: 40px 24px;
      }

      .completion-icon {
        font-size: 64px;
        margin-bottom: 20px;
        animation: completionBounce 0.8s ease-out;
      }

      .completion-title {
        font-size: 28px;
        color: #00ff88;
        margin-bottom: 16px;
        font-weight: 700;
      }

      .completion-text {
        font-size: 16px;
        color: #d4e6ea;
        margin-bottom: 32px;
        line-height: 1.6;
      }

      @keyframes completionBounce {
        0% {
          transform: scale(0) rotate(0deg);
          opacity: 0;
        }
        50% {
          transform: scale(1.2) rotate(180deg);
          opacity: 1;
        }
        100% {
          transform: scale(1) rotate(360deg);
          opacity: 1;
        }
      }

      /* レスポンシブ対応 */
      @media (max-width: 768px) {
        .tutorial-content {
          margin: 20px;
          min-width: auto;
          max-width: calc(100vw - 40px);
        }

        .tutorial-content.position-center,
        .tutorial-content.position-top,
        .tutorial-content.position-bottom,
        .tutorial-content.position-left,
        .tutorial-content.position-right {
          position: fixed;
          top: 50%;
          left: 50%;
          right: auto;
          bottom: auto;
          transform: translate(-50%, -50%);
        }

        .tutorial-navigation {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          transform: none;
          justify-content: center;
          flex-wrap: wrap;
        }

        .tutorial-nav-btn {
          flex: 1;
          min-width: 120px;
        }

        .tutorial-title {
          font-size: 18px;
        }

        .tutorial-text {
          font-size: 14px;
        }
      }

      /* アニメーション */
      .tutorial-content {
        animation: tutorialSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes tutorialSlideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.9) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1) translateY(0);
        }
      }
    `

    document.head.appendChild(styleElement)
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    // ESCキーでチュートリアルを閉じる
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        console.log('🎓 ESC key pressed, closing tutorial')
        this.hide()
        if (this.onClose) this.onClose()
      }
    })

    // オーバーレイクリック処理（詳細ログ付き）
    this.overlay?.addEventListener('click', (event) => {
      console.log('🎓 Tutorial overlay click detected:', {
        target: event.target,
        targetClassName: (event.target as HTMLElement)?.className,
        targetId: (event.target as HTMLElement)?.id,
        currentTarget: event.currentTarget,
        overlayElement: this.overlay
      })
      
      // 背景（オーバーレイ自体）がクリックされた場合
      if (event.target === this.overlay) {
        console.log('🎓 Background clicked - preventing game interaction, not closing tutorial')
        event.preventDefault()
        event.stopPropagation()
        // 背景クリックでチュートリアルは閉じない（ユーザビリティ向上のため）
      }
    })

    console.log('🎓 Tutorial event listeners set up successfully')
  }

  /**
   * チュートリアルステップを表示
   */
  public showStep(step: TutorialStep, stepIndex: number, totalSteps: number): void {
    this.currentStep = step
    this.currentStepIndex = stepIndex
    this.totalSteps = totalSteps

    this.updateContent()
    this.updateNavigation()
    this.show() // 先にオーバーレイを表示
    
    // ハイライト適用と無効化処理を確実に順序立てて実行
    setTimeout(() => {
      this.updateHighlight() // ハイライト適用
      // ハイライトターゲットの識別が完了してから無効化処理を実行
      setTimeout(() => {
        this.applyUIDisabling() // その後で他のUI要素を無効化
        // 無効化処理後にもう一度ハイライト対象を明るくする
        this.ensureHighlightVisible()
      }, 150)
    }, 100)

    console.log(`🎯 Showing tutorial step: ${step.title}`)
  }

  /**
   * コンテンツを更新
   */
  private updateContent(): void {
    if (!this.contentPanel || !this.currentStep) return

    const step = this.currentStep
    const progress = ((this.currentStepIndex + 1) / this.totalSteps) * 100

    this.contentPanel.innerHTML = `
      <div class="tutorial-header">
        <h2 class="tutorial-title">${step.title}</h2>
        <button class="tutorial-close" id="tutorial-close">✕</button>
      </div>
      
      <div class="tutorial-progress">
        <div class="tutorial-step-indicator">
          <div class="tutorial-step-number">${this.currentStepIndex + 1}</div>
          <span>${this.currentStepIndex + 1} / ${this.totalSteps}</span>
        </div>
        <div class="tutorial-progress-bar">
          <div class="tutorial-progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
      
      <div class="tutorial-text">${step.content}</div>
    `

    // 位置を設定
    this.contentPanel.className = `tutorial-content position-${step.position || 'center'}`

    // 閉じるボタンのイベント
    const closeBtn = document.getElementById('tutorial-close')
    closeBtn?.addEventListener('click', () => {
      this.hide()
      if (this.onClose) this.onClose()
    })
  }

  /**
   * ナビゲーションを更新
   */
  private updateNavigation(): void {
    if (!this.navigationPanel) return

    const isFirstStep = this.currentStepIndex === 0
    const isLastStep = this.currentStepIndex === this.totalSteps - 1
    const canGoBack = !isFirstStep
    // canGoForward変数は現在使用されていませんが、将来の拡張のため保持

    // 既存のイベントリスナーをクリア
    this.navigationPanel.innerHTML = ''

    // 戻るボタン
    const prevBtn = document.createElement('button')
    prevBtn.className = 'tutorial-nav-btn'
    prevBtn.id = 'tutorial-prev'
    prevBtn.disabled = !canGoBack
    prevBtn.innerHTML = '<span class="tutorial-icon">◀</span>戻る'
    prevBtn.style.pointerEvents = 'auto'
    prevBtn.style.zIndex = '10004'
    prevBtn.style.cursor = 'pointer'
    prevBtn.style.position = 'relative'
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎓 Tutorial: Previous button clicked')
      if (this.onPrevious) {
        this.onPrevious()
      } else {
        console.warn('🎓 onPrevious handler not set')
      }
    })
    
    // マウスイベントのデバッグログ
    prevBtn.addEventListener('mousedown', () => console.log('🎓 Previous button: mousedown'))
    prevBtn.addEventListener('mouseup', () => console.log('🎓 Previous button: mouseup'))
    prevBtn.addEventListener('mouseover', () => console.log('🎓 Previous button: mouseover'))

    // スキップボタン
    const skipBtn = document.createElement('button')
    skipBtn.className = 'tutorial-nav-btn skip'
    skipBtn.id = 'tutorial-skip'
    skipBtn.innerHTML = '<span class="tutorial-icon">⏭</span>スキップ'
    skipBtn.style.pointerEvents = 'auto'
    skipBtn.style.zIndex = '10004'
    skipBtn.style.cursor = 'pointer'
    skipBtn.style.position = 'relative'
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎓 Tutorial: Skip button clicked')
      if (this.onSkip) {
        this.onSkip()
      } else {
        console.warn('🎓 onSkip handler not set')
      }
    })
    
    // マウスイベントのデバッグログ
    skipBtn.addEventListener('mousedown', () => console.log('🎓 Skip button: mousedown'))
    skipBtn.addEventListener('mouseup', () => console.log('🎓 Skip button: mouseup'))
    skipBtn.addEventListener('mouseover', () => console.log('🎓 Skip button: mouseover'))

    // 次へボタン
    const nextBtn = document.createElement('button')
    nextBtn.className = 'tutorial-nav-btn primary'
    nextBtn.id = 'tutorial-next'
    nextBtn.innerHTML = `<span class="tutorial-icon">${isLastStep ? '🎉' : '▶'}</span>${isLastStep ? '完了' : '次へ'}`
    nextBtn.style.pointerEvents = 'auto'
    nextBtn.style.zIndex = '10004'
    nextBtn.style.cursor = 'pointer'
    nextBtn.style.position = 'relative'
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎓 Tutorial: Next button clicked')
      if (this.onNext) {
        this.onNext()
      } else {
        console.warn('🎓 onNext handler not set')
      }
    })
    
    // マウスイベントのデバッグログ
    nextBtn.addEventListener('mousedown', () => console.log('🎓 Next button: mousedown'))
    nextBtn.addEventListener('mouseup', () => console.log('🎓 Next button: mouseup'))
    nextBtn.addEventListener('mouseover', () => console.log('🎓 Next button: mouseover'))

    // ボタンを追加
    this.navigationPanel.appendChild(prevBtn)
    this.navigationPanel.appendChild(skipBtn)
    this.navigationPanel.appendChild(nextBtn)

    console.log('🎓 Tutorial: Navigation buttons created and styled')
    
    // 詳細な状態確認ログ
    setTimeout(() => {
      console.log('🎓 Navigation Panel State Check:')
      console.log(`  Panel exists: ${!!this.navigationPanel}`)
      console.log(`  Panel in DOM: ${this.navigationPanel ? document.contains(this.navigationPanel) : false}`)
      console.log(`  Panel children: ${this.navigationPanel?.children.length || 0}`)
      
      const buttons = ['tutorial-prev', 'tutorial-next', 'tutorial-skip']
      buttons.forEach(id => {
        const btn = document.getElementById(id)
        if (btn) {
          const rect = btn.getBoundingClientRect()
          const styles = window.getComputedStyle(btn)
          console.log(`  Button ${id}:`, {
            exists: true,
            visible: rect.width > 0 && rect.height > 0,
            position: `${rect.left}, ${rect.top}`,
            size: `${rect.width}x${rect.height}`,
            pointerEvents: styles.pointerEvents,
            zIndex: styles.zIndex,
            cursor: styles.cursor,
            disabled: (btn as HTMLButtonElement).disabled
          })
        } else {
          console.log(`  Button ${id}: NOT FOUND`)
        }
      })
    }, 100)
  }

  /**
   * ハイライトを更新（マスクに穴を開ける新しいアプローチ）
   */
  private updateHighlight(): void {
    if (!this.highlightBox || !this.currentStep || !this.maskOverlay) return

    const targetElement = this.currentStep.targetElement || this.currentStep.highlightElement
    
    console.log(`🔍 DEBUG: Attempting to highlight: ${targetElement}`)
    
    if (targetElement) {
      const element = document.querySelector(targetElement) as HTMLElement
      if (element) {
        // 要素の存在と可視性を確認
        const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0
        const computedStyle = window.getComputedStyle(element)
        const isDisplayed = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
        
        console.log(`🔍 DEBUG: Element visibility check:`, {
          element: element.className,
          isVisible,
          isDisplayed,
          offsetWidth: element.offsetWidth,
          offsetHeight: element.offsetHeight,
          display: computedStyle.display,
          visibility: computedStyle.visibility
        })
        
        if (!isVisible || !isDisplayed) {
          console.warn(`⚠️ Target element is not visible: ${targetElement}`)
          this.highlightBox.classList.add('hidden')
          this.clearMaskHole()
          return
        }
        
        const rect = element.getBoundingClientRect()
        const padding = 16
        
        // 詳細なデバッグログで実際の座標を出力
        console.log(`🔍 DEBUG: Element positioning details:`, {
          selector: targetElement,
          elementClass: element.className,
          rect: {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          },
          windowSize: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          scrollPosition: {
            x: window.scrollX,
            y: window.scrollY
          }
        })
        
        // ハイライトボックスとマスクの穴で同じ座標を使用
        const highlightLeft = rect.left - padding
        const highlightTop = rect.top - padding
        const highlightWidth = rect.width + padding * 2
        const highlightHeight = rect.height + padding * 2
        
        // ハイライトボックスの位置を設定
        this.highlightBox.style.left = `${highlightLeft}px`
        this.highlightBox.style.top = `${highlightTop}px`
        this.highlightBox.style.width = `${highlightWidth}px`
        this.highlightBox.style.height = `${highlightHeight}px`
        this.highlightBox.classList.remove('hidden')
        
        console.log(`🔍 DEBUG: Applied highlight box styles:`, {
          left: highlightLeft,
          top: highlightTop,
          width: highlightWidth,
          height: highlightHeight
        })
        
        // マスクに穴を開ける（同じ座標を使用）
        this.createMaskHole(rect, padding)
        
        // ハイライト対象要素を高いz-indexに設定
        this.elevateTargetElement(element)
        
        // 設定後の検証
        setTimeout(() => {
          const highlightRect = this.highlightBox!.getBoundingClientRect()
          console.log(`🔍 DEBUG: Highlight box actual position:`, {
            left: highlightRect.left,
            top: highlightRect.top,
            width: highlightRect.width,
            height: highlightRect.height,
            isVisible: highlightRect.width > 0 && highlightRect.height > 0
          })
        }, 50)
        
        console.log(`🎯 Highlighting element: ${targetElement}`)
      } else {
        this.highlightBox.classList.add('hidden')
        this.clearMaskHole()
        console.warn(`⚠️ Target element not found: ${targetElement}`)
      }
    } else {
      this.highlightBox.classList.add('hidden')
      this.clearMaskHole()
    }
  }

  /**
   * マスクに穴を開ける
   */
  private createMaskHole(rect: DOMRect, padding: number): void {
    if (!this.maskOverlay) return

    // ハイライトボックスと全く同じ座標を使用
    const x = rect.left - padding
    const y = rect.top - padding
    const width = rect.width + padding * 2
    const height = rect.height + padding * 2
    
    console.log(`🔍 DEBUG: Creating mask hole with coordinates:`, {
      x, y, width, height,
      centerX: x + width/2,
      centerY: y + height/2,
      originalRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }
    })

    // CSS mask-imageを使用して穴を開ける
    const maskImage = `
      radial-gradient(
        ellipse ${width}px ${height}px at ${x + width/2}px ${y + height/2}px,
        transparent 0%,
        transparent 100%
      ),
      linear-gradient(black, black)
    `
    
    this.maskOverlay.style.maskImage = maskImage
    this.maskOverlay.style.maskComposite = 'exclude'
    this.maskOverlay.style.webkitMaskImage = maskImage
    this.maskOverlay.style.webkitMaskComposite = 'xor'
    
    console.log(`🔍 DEBUG: Applied mask styles:`, {
      maskImage: this.maskOverlay.style.maskImage.replace(/\s+/g, ' ').trim()
    })
  }

  /**
   * マスクの穴をクリア
   */
  private clearMaskHole(): void {
    if (!this.maskOverlay) return
    
    this.maskOverlay.style.maskImage = ''
    this.maskOverlay.style.webkitMaskImage = ''
  }

  /**
   * ハイライト対象要素を前面に表示
   */
  private elevateTargetElement(element: HTMLElement): void {
    // 元のスタイルを保存
    element.setAttribute('data-original-zindex', element.style.zIndex || '')
    element.setAttribute('data-original-position', element.style.position || '')
    element.setAttribute('data-original-filter', element.style.filter || '')
    element.setAttribute('data-original-opacity', element.style.opacity || '')
    
    // 極めて高いz-indexを設定（確実に最前面に）
    element.style.setProperty('position', 'relative', 'important')
    element.style.setProperty('z-index', '999999', 'important')
    
    // 明るさも強制的に設定（無効化フィルターを上書き）
    element.style.setProperty('filter', 'brightness(1.2) contrast(1.1)', 'important')
    element.style.setProperty('opacity', '1', 'important')
    element.style.setProperty('pointer-events', 'auto', 'important')
    
    // 子要素も確実に明るく
    const children = element.querySelectorAll('*')
    children.forEach(child => {
      const childEl = child as HTMLElement
      childEl.style.setProperty('opacity', '1', 'important')
      childEl.style.setProperty('filter', 'none', 'important')
    })
    
    // 特別なクラスを追加
    element.classList.add('tutorial-highlight-target')
    element.setAttribute('data-tutorial-highlighted', 'true')
    
    console.log(`✨ Element elevated with extreme z-index: ${element.className}`)
    console.log(`✨ Element computed styles:`, {
      zIndex: window.getComputedStyle(element).zIndex,
      position: window.getComputedStyle(element).position,
      filter: window.getComputedStyle(element).filter,
      opacity: window.getComputedStyle(element).opacity
    })
  }

  /**
   * 完了メッセージを表示
   */
  public showCompletion(): void {
    if (!this.contentPanel) return

    this.contentPanel.innerHTML = `
      <div class="tutorial-completion">
        <div class="completion-icon">🎉</div>
        <h2 class="completion-title">チュートリアル完了！</h2>
        <p class="completion-text">
          お疲れ様でした！これで基本操作をマスターしました。<br>
          さあ、実際のゲームを楽しんでください！
        </p>
      </div>
    `

    this.contentPanel.className = 'tutorial-content position-center'

    if (this.navigationPanel) {
      this.navigationPanel.innerHTML = `
        <button class="tutorial-nav-btn primary" id="tutorial-finish">
          <span class="tutorial-icon">🚀</span>
          ゲーム開始
        </button>
      `

      document.getElementById('tutorial-finish')?.addEventListener('click', () => {
        this.hide()
        if (this.onClose) this.onClose()
      })
    }

    this.highlightBox?.classList.add('hidden')
    this.show()

    // 3秒後に自動で閉じる
    setTimeout(() => {
      this.hide()
      if (this.onClose) this.onClose()
    }, 5000)
  }

  /**
   * UIを表示
   */
  public show(): void {
    if (this.overlay) {
      this.overlay.classList.remove('hidden')
      this.isVisible = true
      
      console.log('🎓 Tutorial UI shown')
    }
  }

  /**
   * UI要素の無効化（ハイライト適用後に実行）
   */
  public applyUIDisabling(): void {
    // 他のUI要素を無効化（ハイライト対象を除外）
    this.disableOtherUIElements()
    console.log('🚫 Other UI elements disabled (excluding highlight target)')
  }

  /**
   * UIを非表示
   */
  public hide(): void {
    if (this.overlay) {
      this.overlay.classList.add('hidden')
      this.isVisible = false
      
      // ハイライト要素の状態を復元
      this.clearHighlightEffects()
      
      // 他のUI要素を再有効化
      this.enableOtherUIElements()
      
      console.log('🎓 Tutorial UI hidden, other UI elements re-enabled')
    }
  }

  /**
   * 表示状態を取得
   */
  public getVisibility(): boolean {
    return this.isVisible
  }

  /**
   * イベントハンドラーを設定
   */
  public setEventHandlers(handlers: {
    onNext?: () => void
    onPrevious?: () => void
    onSkip?: () => void
    onClose?: () => void
  }): void {
    this.onNext = handlers.onNext
    this.onPrevious = handlers.onPrevious
    this.onSkip = handlers.onSkip
    this.onClose = handlers.onClose
  }

  /**
   * チュートリアル中に他のUI要素を無効化（新しいアプローチではほぼ不要）
   */
  private disableOtherUIElements(): void {
    // マスクオーバーレイが全体を暗くするため、個別の無効化は最小限に
    // 現在のハイライト対象要素を取得
    const highlightTargetSelector = this.currentStep?.targetElement || this.currentStep?.highlightElement
    
    console.log(`🎯 DEBUG: Highlight target selector: "${highlightTargetSelector}"`)
    
    // まず、ハイライト対象要素を取得して識別
    const highlightTargets = new Set<HTMLElement>()
    if (highlightTargetSelector) {
      const targets = document.querySelectorAll(highlightTargetSelector)
      targets.forEach(target => {
        highlightTargets.add(target as HTMLElement)
        console.log(`🎯 DEBUG: Found highlight target: ${(target as HTMLElement).className}`)
      })
    }
    
    // 無効化対象のUI要素セレクター
    const uiSelectors = [
      '.game-hud',
      '.tower-purchase-panel', 
      '.player-control-panel',
      '.debug-panel',
      '#settings-menu-overlay',
      '.main-menu-overlay',
      '.economy-panel',
      '.map-editor-ui'
    ]
    
    uiSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        const htmlElement = element as HTMLElement
        
        // ハイライト対象要素かどうかを確認
        const isHighlightTarget = highlightTargets.has(htmlElement)
        const hasHighlightClass = htmlElement.classList.contains('tutorial-highlight-target') || 
                                  htmlElement.classList.contains('tutorial-highlight-active')
        const hasDataHighlighted = htmlElement.getAttribute('data-tutorial-highlighted') === 'true'
        
        // 親要素がハイライト対象かどうかチェック
        let hasHighlightParent = false
        for (const target of highlightTargets) {
          if (target.contains(htmlElement)) {
            hasHighlightParent = true
            break
          }
        }
        
        console.log(`🔍 DEBUG: Checking element for disable:`, {
          selector,
          elementClass: htmlElement.className,
          isHighlightTarget,
          hasHighlightClass,
          hasDataHighlighted,
          hasHighlightParent
        })
        
        // ハイライト対象要素は絶対に無効化しない
        if (isHighlightTarget || hasHighlightClass || hasDataHighlighted || hasHighlightParent) {
          console.log(`🎯 SKIPPING disable for highlight target: ${selector}`)
          // 念のため、ハイライトスタイルを再適用
          htmlElement.style.setProperty('filter', 'brightness(1.3) contrast(1.2)', 'important')
          htmlElement.style.setProperty('opacity', '1', 'important')
          return
        }
        
        // 既存のpointer-eventsを保存
        const currentPointerEvents = window.getComputedStyle(htmlElement).pointerEvents
        htmlElement.setAttribute('data-tutorial-original-pointer-events', currentPointerEvents)
        
        // pointer-eventsを無効化（フィルターは適用しない）
        htmlElement.style.pointerEvents = 'none'
        htmlElement.setAttribute('data-tutorial-disabled', 'true')
      })
    })
    
    // 設定ボタンなど個別ボタンも無効化
    const buttonSelectors = [
      '.purchase-btn',
      '.control-btn', 
      '.action-btn',
      '.back-btn',
      '#settings-back-btn',
      '#apply-settings-btn',
      '#reset-settings-btn'
    ]
    
    buttonSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        const button = element as HTMLButtonElement
        
        // ハイライト対象要素は無効化しない
        const hasHighlightClass = button.classList.contains('tutorial-highlight-target') || button.classList.contains('tutorial-highlight-active')
        const matchesSelector = highlightTargetSelector && button.matches(highlightTargetSelector)
        const hasHighlightParent = button.closest('.tutorial-highlight-target') || button.closest('.tutorial-highlight-active')
        
        if (hasHighlightClass || matchesSelector || hasHighlightParent) {
          console.log(`🎯 Skipping disable for highlight target button: ${selector}`)
          return
        }
        
        const originalDisabled = button.disabled
        button.setAttribute('data-tutorial-original-disabled', originalDisabled.toString())
        button.disabled = true
        button.style.opacity = '0.3'
        button.setAttribute('data-tutorial-disabled', 'true')
      })
    })
    
    console.log('🚫 Other UI elements disabled during tutorial')
  }

  /**
   * チュートリアル終了時に他のUI要素を再有効化
   */
  private enableOtherUIElements(): void {
    // pointer-eventsで無効化された要素を復元
    const disabledElements = document.querySelectorAll('[data-tutorial-disabled="true"]')
    disabledElements.forEach(element => {
      const htmlElement = element as HTMLElement
      
      // HTMLElementの場合
      if (htmlElement.style) {
        const originalPointerEvents = htmlElement.getAttribute('data-tutorial-original-pointer-events')
        if (originalPointerEvents) {
          htmlElement.style.pointerEvents = originalPointerEvents === 'none' ? '' : originalPointerEvents
        } else {
          htmlElement.style.pointerEvents = ''
        }
        htmlElement.removeAttribute('data-tutorial-original-pointer-events')
      }
      
      // ボタンの場合
      if (htmlElement instanceof HTMLButtonElement) {
        const originalDisabled = htmlElement.getAttribute('data-tutorial-original-disabled')
        htmlElement.disabled = originalDisabled === 'true'
        htmlElement.style.opacity = ''
        htmlElement.removeAttribute('data-tutorial-original-disabled')
      }
      
      htmlElement.removeAttribute('data-tutorial-disabled')
    })
    
    console.log('✅ Other UI elements re-enabled after tutorial')
  }


  /**
   * ハイライトエフェクトをクリア
   */
  private clearHighlightEffects(): void {
    // マスクの穴をクリア
    this.clearMaskHole()
    
    // 高いz-indexを復元
    const highlightedElements = document.querySelectorAll('[data-tutorial-highlighted="true"]')
    highlightedElements.forEach(element => {
      const el = element as HTMLElement
      
      // 元のスタイルを復元
      const originalZIndex = el.getAttribute('data-original-zindex')
      const originalPosition = el.getAttribute('data-original-position')
      const originalFilter = el.getAttribute('data-original-filter')
      const originalOpacity = el.getAttribute('data-original-opacity')
      
      el.style.zIndex = originalZIndex || ''
      el.style.position = originalPosition || ''
      el.style.filter = originalFilter || ''
      el.style.opacity = originalOpacity || ''
      
      // 強制的に設定したスタイルを削除
      el.style.removeProperty('z-index')
      el.style.removeProperty('position')
      el.style.removeProperty('filter')
      el.style.removeProperty('opacity')
      el.style.removeProperty('pointer-events')
      
      // 子要素のスタイルも復元
      const children = el.querySelectorAll('*')
      children.forEach(child => {
        const childEl = child as HTMLElement
        childEl.style.removeProperty('opacity')
        childEl.style.removeProperty('filter')
      })
      
      // 属性とクラスを削除
      el.removeAttribute('data-original-zindex')
      el.removeAttribute('data-original-position')
      el.removeAttribute('data-original-filter')
      el.removeAttribute('data-original-opacity')
      el.classList.remove('tutorial-highlight-target')
      el.removeAttribute('data-tutorial-highlighted')
    })
    
    console.log('✅ Highlight effects cleared and original states restored')
  }

  /**
   * ハイライト対象が確実に表示されるようにする（新しいマスクアプローチでは不要）
   */
  private ensureHighlightVisible(): void {
    // マスクに穴を開けるアプローチでは、この処理は不要
    // ハイライト対象は自然に明るく表示される
  }
  
  /**
   * リソースクリーンアップ
   */
  public destroy(): void {
    // ハイライトエフェクトをクリア
    this.clearHighlightEffects()
    
    // 他のUI要素を確実に再有効化
    if (this.isVisible) {
      this.enableOtherUIElements()
    }
    
    // スタイルを削除
    const styleElement = document.getElementById('tutorial-styles')
    styleElement?.remove()

    // UI要素を削除
    this.overlay?.remove()
    this.maskOverlay = null

    this.overlay = null
    this.highlightBox = null
    this.contentPanel = null
    this.navigationPanel = null
    this.currentStep = null
    this.isVisible = false

    console.log('🗑️ TutorialUI destroyed and other UI elements restored')
  }
}