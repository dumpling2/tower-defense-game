import { TutorialStep } from './TutorialSystem'

/**
 * チュートリアルUIクラス - 改良版
 * 4つの矩形でハイライト領域以外を覆うアプローチ
 */
export class TutorialUI {
  private overlay: HTMLElement | null = null
  private darkRects: {
    top: HTMLElement | null
    bottom: HTMLElement | null
    left: HTMLElement | null
    right: HTMLElement | null
  } = { top: null, bottom: null, left: null, right: null }
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
    console.log('🎨 TutorialUI initialized (improved version)')
  }

  /**
   * UI要素を作成
   */
  private createUI(): void {
    // メインオーバーレイ（pointer-events: noneで常に透過）
    this.overlay = document.createElement('div')
    this.overlay.id = 'tutorial-overlay'
    this.overlay.className = 'tutorial-overlay hidden'

    // 4つの暗い矩形を作成（ハイライト領域以外を覆う）
    this.darkRects.top = document.createElement('div')
    this.darkRects.top.className = 'tutorial-dark-rect tutorial-dark-top'
    
    this.darkRects.bottom = document.createElement('div')
    this.darkRects.bottom.className = 'tutorial-dark-rect tutorial-dark-bottom'
    
    this.darkRects.left = document.createElement('div')
    this.darkRects.left.className = 'tutorial-dark-rect tutorial-dark-left'
    
    this.darkRects.right = document.createElement('div')
    this.darkRects.right.className = 'tutorial-dark-rect tutorial-dark-right'

    // ハイライトボックス（装飾的な枠線）
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
    this.overlay.appendChild(this.darkRects.top)
    this.overlay.appendChild(this.darkRects.bottom)
    this.overlay.appendChild(this.darkRects.left)
    this.overlay.appendChild(this.darkRects.right)
    this.overlay.appendChild(this.highlightBox)
    this.overlay.appendChild(this.contentPanel)
    this.overlay.appendChild(this.navigationPanel)

    // DOMに追加
    document.body.appendChild(this.overlay)

    this.createStyles()
  }

  /**
   * スタイルを作成
   */
  private createStyles(): void {
    const styleElement = document.createElement('style')
    styleElement.id = 'tutorial-styles-improved'
    styleElement.textContent = `
      /* メインオーバーレイ - 常にpointer-events: none */
      .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        pointer-events: none !important;
        transition: opacity 0.3s ease;
      }

      .tutorial-overlay.hidden {
        opacity: 0;
        visibility: hidden;
      }

      /* 暗い矩形（4つでハイライト領域以外を覆う） */
      .tutorial-dark-rect {
        position: fixed;
        background: rgba(0, 0, 0, 0.75);
        z-index: 10001;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* ハイライトボックス（装飾のみ） */
      .tutorial-highlight {
        position: fixed;
        border: 4px solid #00d4ff;
        border-radius: 12px;
        background: transparent;
        box-shadow: 
          0 0 0 3px rgba(0, 212, 255, 0.8),
          0 0 30px rgba(0, 212, 255, 1.0),
          0 0 50px rgba(0, 212, 255, 0.6);
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        animation: tutorialPulse 2s infinite ease-in-out;
        z-index: 10002;
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
            0 0 50px rgba(0, 212, 255, 0.6);
        }
        50% {
          transform: scale(1.02);
          box-shadow: 
            0 0 0 6px rgba(0, 212, 255, 1.0),
            0 0 40px rgba(0, 212, 255, 1.0),
            0 0 60px rgba(0, 212, 255, 0.8);
        }
      }

      /* コンテンツパネル */
      .tutorial-content {
        position: fixed;
        background: linear-gradient(135deg, #1a2b3a, #0f1a24);
        border: 2px solid rgba(0, 212, 255, 0.6);
        border-radius: 16px;
        padding: 24px;
        color: #e8f4f8;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(255, 255, 255, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        min-width: 320px;
        max-width: 480px;
        z-index: 10003;
        pointer-events: auto;
      }

      .tutorial-content.position-center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .tutorial-content.position-bottom {
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
      }

      .tutorial-content.position-right {
        top: 50%;
        right: 24px;
        transform: translateY(-50%);
      }

      .tutorial-content.position-top {
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
      }

      .tutorial-content.position-left {
        top: 50%;
        left: 24px;
        transform: translateY(-50%);
      }

      /* チュートリアルヘッダー */
      .tutorial-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .tutorial-title {
        margin: 0;
        font-size: 20px;
        color: #00d4ff;
      }

      .tutorial-close {
        background: none;
        border: none;
        color: #aaa;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        transition: color 0.2s;
      }

      .tutorial-close:hover {
        color: #fff;
      }

      /* プログレス */
      .tutorial-progress {
        margin-bottom: 16px;
      }

      .tutorial-step-indicator {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .tutorial-step-number {
        background: #00d4ff;
        color: #0a1420;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      }

      .tutorial-progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }

      .tutorial-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d4ff, #0099cc);
        border-radius: 3px;
        transition: width 0.4s ease;
      }

      /* テキスト */
      .tutorial-text {
        line-height: 1.6;
        font-size: 14px;
        color: #d4e6ea;
      }

      /* ナビゲーションパネル */
      .tutorial-navigation {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        z-index: 10004;
        pointer-events: auto;
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
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .tutorial-nav-btn:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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
    `

    document.head.appendChild(styleElement)
  }

  /**
   * 4つの矩形でハイライト領域以外を覆う
   */
  private updateDarkRects(rect: DOMRect | null, padding: number = 16): void {
    if (!rect) {
      // ハイライトなしの場合は全画面を覆う
      if (this.darkRects.top) {
        this.darkRects.top.style.left = '0'
        this.darkRects.top.style.top = '0'
        this.darkRects.top.style.width = '100vw'
        this.darkRects.top.style.height = '100vh'
      }
      // 他の矩形は非表示
      if (this.darkRects.bottom) this.darkRects.bottom.style.display = 'none'
      if (this.darkRects.left) this.darkRects.left.style.display = 'none'
      if (this.darkRects.right) this.darkRects.right.style.display = 'none'
      return
    }

    // ハイライト領域の座標
    const highlightLeft = rect.left - padding
    const highlightTop = rect.top - padding
    const highlightRight = rect.right + padding
    const highlightBottom = rect.bottom + padding
    const highlightWidth = highlightRight - highlightLeft
    const highlightHeight = highlightBottom - highlightTop

    // 上部矩形
    if (this.darkRects.top) {
      this.darkRects.top.style.display = 'block'
      this.darkRects.top.style.left = '0'
      this.darkRects.top.style.top = '0'
      this.darkRects.top.style.width = '100vw'
      this.darkRects.top.style.height = `${highlightTop}px`
    }

    // 下部矩形
    if (this.darkRects.bottom) {
      this.darkRects.bottom.style.display = 'block'
      this.darkRects.bottom.style.left = '0'
      this.darkRects.bottom.style.top = `${highlightBottom}px`
      this.darkRects.bottom.style.width = '100vw'
      this.darkRects.bottom.style.height = `calc(100vh - ${highlightBottom}px)`
    }

    // 左部矩形
    if (this.darkRects.left) {
      this.darkRects.left.style.display = 'block'
      this.darkRects.left.style.left = '0'
      this.darkRects.left.style.top = `${highlightTop}px`
      this.darkRects.left.style.width = `${highlightLeft}px`
      this.darkRects.left.style.height = `${highlightHeight}px`
    }

    // 右部矩形
    if (this.darkRects.right) {
      this.darkRects.right.style.display = 'block'
      this.darkRects.right.style.left = `${highlightRight}px`
      this.darkRects.right.style.top = `${highlightTop}px`
      this.darkRects.right.style.width = `calc(100vw - ${highlightRight}px)`
      this.darkRects.right.style.height = `${highlightHeight}px`
    }

    console.log(`🔲 Dark rects updated for highlight area:`, {
      left: highlightLeft,
      top: highlightTop,
      width: highlightWidth,
      height: highlightHeight
    })
  }

  /**
   * ハイライトを更新
   */
  private updateHighlight(): void {
    if (!this.highlightBox || !this.currentStep) return

    const targetElement = this.currentStep.targetElement || this.currentStep.highlightElement
    
    console.log(`🔍 Attempting to highlight: ${targetElement}`)
    
    if (targetElement) {
      const element = document.querySelector(targetElement) as HTMLElement
      if (element) {
        const rect = element.getBoundingClientRect()
        const padding = 16
        
        console.log(`🔍 Element rect:`, {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          elementClass: element.className
        })
        
        // ハイライトボックスの位置設定
        const highlightLeft = rect.left - padding
        const highlightTop = rect.top - padding
        const highlightWidth = rect.width + padding * 2
        const highlightHeight = rect.height + padding * 2
        
        this.highlightBox.style.left = `${highlightLeft}px`
        this.highlightBox.style.top = `${highlightTop}px`
        this.highlightBox.style.width = `${highlightWidth}px`
        this.highlightBox.style.height = `${highlightHeight}px`
        this.highlightBox.classList.remove('hidden')
        
        // 4つの矩形でハイライト以外を覆う
        this.updateDarkRects(rect, padding)
        
        console.log(`🎯 Applied highlight at: ${highlightLeft}, ${highlightTop}, ${highlightWidth}x${highlightHeight}`)
      } else {
        this.highlightBox.classList.add('hidden')
        this.updateDarkRects(null)
        console.warn(`⚠️ Target element not found: ${targetElement}`)
      }
    } else {
      this.highlightBox.classList.add('hidden')
      this.updateDarkRects(null)
    }
  }

  /**
   * ステップを表示
   */
  public showStep(step: TutorialStep, stepIndex: number, totalSteps: number): void {
    this.currentStep = step
    this.currentStepIndex = stepIndex
    this.totalSteps = totalSteps

    this.updateContent()
    this.updateNavigation()
    this.show()

    // ハイライト更新は少し遅延させる（DOMの更新を待つ）
    setTimeout(() => {
      this.updateHighlight()
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
          <span style="font-size: 14px; color: #aaa;">${this.currentStepIndex + 1} / ${this.totalSteps}</span>
        </div>
        <div class="tutorial-progress-bar">
          <div class="tutorial-progress-fill" style="width: ${progress}%;"></div>
        </div>
      </div>
      
      <div class="tutorial-text">${step.content}</div>
    `

    // 位置クラスを設定
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

    const hasPrevious = this.currentStepIndex > 0
    const hasNext = this.currentStepIndex < this.totalSteps - 1

    this.navigationPanel.innerHTML = `
      ${hasPrevious ? '<button class="tutorial-nav-btn" id="tutorial-prev">◀ 戻る</button>' : ''}
      <button class="tutorial-nav-btn skip" id="tutorial-skip">スキップ</button>
      ${hasNext ? '<button class="tutorial-nav-btn primary" id="tutorial-next">次へ ▶</button>' : '<button class="tutorial-nav-btn primary" id="tutorial-finish">完了</button>'}
    `

    // イベントリスナーを設定
    if (hasPrevious) {
      document.getElementById('tutorial-prev')?.addEventListener('click', () => {
        console.log('🔙 Previous button clicked')
        if (this.onPrevious) this.onPrevious()
      })
    }

    document.getElementById('tutorial-skip')?.addEventListener('click', () => {
      console.log('⏭️ Skip button clicked')
      if (this.onSkip) this.onSkip()
    })

    if (hasNext) {
      document.getElementById('tutorial-next')?.addEventListener('click', () => {
        console.log('➡️ Next button clicked')
        if (this.onNext) this.onNext()
      })
    } else {
      document.getElementById('tutorial-finish')?.addEventListener('click', () => {
        console.log('✅ Finish button clicked')
        if (this.onClose) this.onClose()
      })
    }
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
   * UIを非表示
   */
  public hide(): void {
    if (this.overlay) {
      this.overlay.classList.add('hidden')
      this.isVisible = false
      console.log('🎓 Tutorial UI hidden')
    }
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
   * 表示状態を取得
   */
  public getVisibility(): boolean {
    return this.isVisible
  }

  /**
   * 完了メッセージを表示
   */
  public showCompletion(): void {
    if (!this.contentPanel) return

    this.contentPanel.innerHTML = `
      <div style="text-align: center; padding: 40px 24px;">
        <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
        <h2 style="font-size: 28px; color: #00ff88; margin-bottom: 16px; font-weight: 700;">チュートリアル完了！</h2>
        <p style="font-size: 16px; color: #d4e6ea; margin-bottom: 32px; line-height: 1.6;">
          お疲れ様でした！これで基本操作をマスターしました。<br>
          さあ、実際のゲームを楽しんでください！
        </p>
      </div>
    `

    this.contentPanel.className = 'tutorial-content position-center'

    if (this.navigationPanel) {
      this.navigationPanel.innerHTML = `
        <button class="tutorial-nav-btn primary" id="tutorial-finish">
          🚀 ゲーム開始
        </button>
      `

      document.getElementById('tutorial-finish')?.addEventListener('click', () => {
        this.hide()
        if (this.onClose) this.onClose()
      })
    }

    this.highlightBox?.classList.add('hidden')
    this.updateDarkRects(null)
    this.show()

    // 3秒後に自動で閉じる
    setTimeout(() => {
      this.hide()
      if (this.onClose) this.onClose()
    }, 5000)
  }

  /**
   * リソースクリーンアップ
   */
  public destroy(): void {
    // スタイルを削除
    const styleElement = document.getElementById('tutorial-styles-improved')
    styleElement?.remove()

    // UI要素を削除
    this.overlay?.remove()

    this.overlay = null
    this.darkRects = { top: null, bottom: null, left: null, right: null }
    this.highlightBox = null
    this.contentPanel = null
    this.navigationPanel = null
    this.currentStep = null
    this.isVisible = false

    console.log('🗑️ TutorialUI destroyed')
  }
}