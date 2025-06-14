import { TutorialStep } from './TutorialSystem'

/**
 * チュートリアルUIクラス
 * オーバーレイ、ハイライト、ナビゲーション機能を提供
 */
export class TutorialUI {
  private overlay: HTMLElement | null = null
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
    // メインオーバーレイ
    this.overlay = document.createElement('div')
    this.overlay.id = 'tutorial-overlay'
    this.overlay.className = 'tutorial-overlay hidden'

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
      /* チュートリアルオーバーレイ */
      .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        pointer-events: auto;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 1;
        visibility: visible;
      }

      .tutorial-overlay.hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      /* ハイライトボックス */
      .tutorial-highlight {
        position: absolute;
        border: 3px solid #00d4ff;
        border-radius: 8px;
        background: rgba(0, 212, 255, 0.1);
        box-shadow: 
          0 0 0 2px rgba(0, 212, 255, 0.3),
          0 0 20px rgba(0, 212, 255, 0.5),
          inset 0 0 20px rgba(0, 212, 255, 0.1);
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        animation: tutorialPulse 2s infinite ease-in-out;
        z-index: 10001;
      }

      .tutorial-highlight.hidden {
        opacity: 0;
        transform: scale(0.8);
      }

      @keyframes tutorialPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 
            0 0 0 2px rgba(0, 212, 255, 0.3),
            0 0 20px rgba(0, 212, 255, 0.5),
            inset 0 0 20px rgba(0, 212, 255, 0.1);
        }
        50% {
          transform: scale(1.02);
          box-shadow: 
            0 0 0 4px rgba(0, 212, 255, 0.5),
            0 0 30px rgba(0, 212, 255, 0.7),
            inset 0 0 30px rgba(0, 212, 255, 0.2);
        }
      }

      /* コンテンツパネル */
      .tutorial-content {
        position: absolute;
        min-width: 320px;
        max-width: 480px;
        background: linear-gradient(145deg, rgba(15, 25, 40, 0.98), rgba(20, 30, 45, 0.98));
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 
          0 16px 48px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 10002;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #e8f4f8;
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
        font-size: 20px;
        font-weight: 700;
        color: #00d4ff;
        margin: 0;
        text-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
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
        font-size: 15px;
        line-height: 1.6;
        color: #d4e6ea;
        margin-bottom: 24px;
      }

      .tutorial-text strong {
        color: #00d4ff;
        font-weight: 600;
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
        padding: 12px 16px;
        background: rgba(0, 212, 255, 0.05);
        border: 1px solid rgba(0, 212, 255, 0.2);
        border-radius: 8px;
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
        this.hide()
        if (this.onClose) this.onClose()
      }
    })

    // オーバーレイクリックで閉じる（コンテンツエリア以外）
    this.overlay?.addEventListener('click', (event) => {
      if (event.target === this.overlay) {
        this.hide()
        if (this.onClose) this.onClose()
      }
    })
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
    this.updateHighlight()
    this.show()

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
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎓 Tutorial: Previous button clicked')
      if (this.onPrevious) this.onPrevious()
    })

    // スキップボタン
    const skipBtn = document.createElement('button')
    skipBtn.className = 'tutorial-nav-btn skip'
    skipBtn.id = 'tutorial-skip'
    skipBtn.innerHTML = '<span class="tutorial-icon">⏭</span>スキップ'
    skipBtn.style.pointerEvents = 'auto'
    skipBtn.style.zIndex = '10004'
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎓 Tutorial: Skip button clicked')
      if (this.onSkip) this.onSkip()
    })

    // 次へボタン
    const nextBtn = document.createElement('button')
    nextBtn.className = 'tutorial-nav-btn primary'
    nextBtn.id = 'tutorial-next'
    nextBtn.innerHTML = `<span class="tutorial-icon">${isLastStep ? '🎉' : '▶'}</span>${isLastStep ? '完了' : '次へ'}`
    nextBtn.style.pointerEvents = 'auto'
    nextBtn.style.zIndex = '10004'
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎓 Tutorial: Next button clicked')
      if (this.onNext) this.onNext()
    })

    // ボタンを追加
    this.navigationPanel.appendChild(prevBtn)
    this.navigationPanel.appendChild(skipBtn)
    this.navigationPanel.appendChild(nextBtn)

    console.log('🎓 Tutorial: Navigation buttons created and styled')
  }

  /**
   * ハイライトを更新
   */
  private updateHighlight(): void {
    if (!this.highlightBox || !this.currentStep) return

    const targetElement = this.currentStep.targetElement || this.currentStep.highlightElement
    
    if (targetElement) {
      const element = document.querySelector(targetElement) as HTMLElement
      if (element) {
        const rect = element.getBoundingClientRect()
        const padding = 8

        this.highlightBox.style.left = `${rect.left - padding}px`
        this.highlightBox.style.top = `${rect.top - padding}px`
        this.highlightBox.style.width = `${rect.width + padding * 2}px`
        this.highlightBox.style.height = `${rect.height + padding * 2}px`
        this.highlightBox.classList.remove('hidden')
        
        console.log(`🎯 Highlighting element: ${targetElement}`)
      } else {
        this.highlightBox.classList.add('hidden')
        console.warn(`⚠️ Target element not found: ${targetElement}`)
      }
    } else {
      this.highlightBox.classList.add('hidden')
    }
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
      
      // ハイライト位置を再計算
      setTimeout(() => this.updateHighlight(), 100)
    }
  }

  /**
   * UIを非表示
   */
  public hide(): void {
    if (this.overlay) {
      this.overlay.classList.add('hidden')
      this.isVisible = false
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
   * リソースクリーンアップ
   */
  public destroy(): void {
    // スタイルを削除
    const styleElement = document.getElementById('tutorial-styles')
    styleElement?.remove()

    // UI要素を削除
    this.overlay?.remove()

    this.overlay = null
    this.highlightBox = null
    this.contentPanel = null
    this.navigationPanel = null
    this.currentStep = null
    this.isVisible = false

    console.log('🗑️ TutorialUI destroyed')
  }
}