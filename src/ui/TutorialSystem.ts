import { GameState } from '@/game/GameState'
import { TutorialUI } from './TutorialUI'

export interface TutorialStep {
  id: string
  title: string
  content: string
  targetElement?: string
  highlightElement?: string
  action?: 'click' | 'build' | 'upgrade' | 'wait' | 'manual'
  actionData?: any
  skipCondition?: () => boolean
  beforeStep?: () => void
  afterStep?: () => void
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export interface TutorialProgress {
  completed: boolean
  currentStepIndex: number
  skipped: boolean
  startTime?: number
  endTime?: number
}

/**
 * 包括的なチュートリアルシステム
 * 新規プレイヤーにゲームの基本操作を段階的に指導
 */
export class TutorialSystem {
  // @ts-ignore - For future tutorial integration
  private _gameState: GameState
  private tutorialUI: TutorialUI
  private steps: TutorialStep[] = []
  private currentStepIndex = 0
  private isActive = false
  private isCompleted = false
  private isSkipped = false
  private startTime: number | undefined
  private endTime: number | undefined
  private onComplete?: () => void
  private onSkip?: () => void
  
  // ローカルストレージキー
  private readonly STORAGE_KEY = 'tower-defense-tutorial-progress'

  constructor(gameState: GameState) {
    this._gameState = gameState
    this.tutorialUI = new TutorialUI()
    this.setupTutorialSteps()
    this.loadProgress()
    
    console.log('🎓 TutorialSystem initialized')
  }

  private setupTutorialSteps(): void {
    this.steps = [
      // ステップ1: ゲーム基本紹介
      {
        id: 'welcome',
        title: '🏰 タワーディフェンスゲームへようこそ！',
        content: `このゲームは<strong>タワーディフェンス</strong>ゲームです。<br><br>
        🎯 <strong>目標</strong>: 敵がゴールに到達するのを防ぐ<br>
        🏗️ <strong>方法</strong>: タワーを建設して敵を攻撃<br>
        💰 <strong>資源</strong>: お金を使ってタワーを購入・強化<br><br>
        さあ、基本操作を学んでいきましょう！`,
        position: 'center',
        action: 'manual'
      },

      // ステップ2: 画面UI説明
      {
        id: 'ui-overview',
        title: '📱 ゲーム画面の見方',
        content: `画面上部には重要な情報が表示されています：<br><br>
        💰 <strong>資金</strong>: タワー購入に使用<br>
        ❤️ <strong>ライフ</strong>: 敵がゴールに到達すると減少<br>
        🌊 <strong>ウェーブ</strong>: 現在の敵の波<br>
        👹 <strong>敵残数</strong>: このウェーブの残り敵数<br><br>
        ライフが0になるとゲームオーバーです！`,
        targetElement: '.game-hud',
        highlightElement: '.game-hud',
        position: 'bottom',
        action: 'manual'
      },

      // ステップ3: タワー購入パネル紹介
      {
        id: 'tower-panel',
        title: '🏗️ タワー建設パネル',
        content: `左側のパネルには5種類のタワーがあります：<br><br>
        🏢 <strong>ベーシック</strong>: バランス型（25ダメージ・150射程）<br>
        🔥 <strong>ラピッド</strong>: 高速連射（15ダメージ・6発/秒）<br>
        💣 <strong>ヘビー</strong>: 大火力（80ダメージ・低速）<br>
        🎯 <strong>スナイパー</strong>: 超長射程（300射程・100ダメージ）<br>
        💥 <strong>スプラッシュ</strong>: 範囲攻撃（複数の敵を同時攻撃）<br><br>
        それぞれ異なる戦略に適しています！`,
        targetElement: '.tower-purchase-panel',
        highlightElement: '.tower-purchase-panel',
        position: 'right',
        action: 'manual'
      },

      // ステップ4: 最初のタワー建設
      {
        id: 'first-tower',
        title: '🔨 初めてのタワー建設',
        content: `実際にタワーを建設してみましょう！<br><br>
        1. <strong>ベーシックタワー</strong>の「購入」ボタンをクリック<br>
        2. マップ上の任意の場所をクリックして配置<br><br>
        💡 <strong>ヒント</strong>: 敵の通り道に近い場所に建設すると効果的です。<br>
        ESCキーで配置をキャンセルできます。`,
        targetElement: '.tower-card[data-tower-type="basic"]',
        highlightElement: '.tower-card[data-tower-type="basic"]',
        position: 'right',
        action: 'build',
        actionData: { towerType: 'basic' }
      },

      // ステップ5: タワー選択とアップグレード
      {
        id: 'tower-upgrade',
        title: '⬆️ タワーのアップグレード',
        content: `建設したタワーを強化できます！<br><br>
        1. 建設したタワーを<strong>クリック</strong>して選択<br>
        2. 画面下部にアップグレードパネルが表示されます<br>
        3. 「アップグレード」ボタンで性能向上<br><br>
        📈 <strong>効果</strong>: ダメージ・射程・攻撃速度が同時に向上<br>
        💰 <strong>コスト</strong>: レベルに応じて費用が増加`,
        action: 'upgrade',
        position: 'center'
      },

      // ステップ6: ウェーブシステム説明
      {
        id: 'wave-system',
        title: '🌊 ウェーブシステム',
        content: `敵は<strong>ウェーブ</strong>という波で出現します：<br><br>
        ⏱️ <strong>準備時間</strong>: 各ウェーブ間に10秒の準備期間<br>
        📈 <strong>難易度上昇</strong>: ウェーブごとに敵が強くなる<br>
        👑 <strong>ボスウェーブ</strong>: 5ウェーブごとに強力なボス敵<br>
        💰 <strong>報酬</strong>: ウェーブクリアで資金獲得<br><br>
        準備時間を活用して戦略を立てましょう！`,
        position: 'center',
        action: 'manual'
      },

      // ステップ7: 敵タイプ説明
      {
        id: 'enemy-types',
        title: '👹 敵の種類と対策',
        content: `5種類の敵が登場します：<br><br>
        👹 <strong>ベーシック兵</strong>: 標準的な敵（HP100・速度50）<br>
        💨 <strong>スピード兵</strong>: 高速移動（HP60・速度90）<br>
        🛡️ <strong>ヘビー兵</strong>: 高耐久（HP300・ミサイル耐性20%）<br>
        🔰 <strong>アーマー兵</strong>: 装甲・回復能力（HP200・耐性40%）<br>
        👑 <strong>ボス</strong>: 最強敵（HP1000・多重耐性・回復）<br><br>
        敵に応じてタワーを使い分けましょう！`,
        position: 'center',
        action: 'manual'
      },

      // ステップ8: 経済システム
      {
        id: 'economy',
        title: '💰 資金管理の基本',
        content: `効率的な資金管理が勝利の鍵です：<br><br>
        💵 <strong>収入源</strong>:<br>
        　• 敵撃破時の報酬<br>
        　• ウェーブクリア報酬<br>
        　• タワー売却（建設費の70%）<br><br>
        💸 <strong>支出</strong>:<br>
        　• タワー建設コスト<br>
        　• アップグレード費用<br><br>
        バランスよく投資しましょう！`,
        position: 'center',
        action: 'manual'
      },

      // ステップ9: ゲーム制御
      {
        id: 'game-controls',
        title: '🎮 ゲーム操作とショートカット',
        content: `便利な操作方法を覚えましょう：<br><br>
        ⌨️ <strong>キーボード</strong>:<br>
        　• <kbd>Space</kbd>: ゲーム一時停止<br>
        　• <kbd>Ctrl+D</kbd>: デバッグパネル表示<br>
        　• <kbd>ESC</kbd>: タワー配置キャンセル<br><br>
        🖱️ <strong>マウス</strong>:<br>
        　• クリック: タワー選択・配置<br>
        　• ホバー: 射程表示<br><br>
        これでチュートリアル完了です！`,
        position: 'center',
        action: 'manual'
      }
    ]

    console.log(`📚 ${this.steps.length} tutorial steps configured`)
  }

  /**
   * チュートリアルを開始
   */
  public startTutorial(): void {
    if (this.isCompleted && !this.shouldRestartTutorial()) {
      console.log('📖 Tutorial already completed')
      return
    }

    this.isActive = true
    this.isCompleted = false
    this.isSkipped = false
    this.currentStepIndex = 0
    this.startTime = Date.now()
    
    console.log('🎓 Starting tutorial...')
    this.showCurrentStep()
  }

  /**
   * チュートリアルをスキップ
   */
  public skipTutorial(): void {
    if (!this.isActive) return

    this.isSkipped = true
    this.isActive = false
    this.endTime = Date.now()
    
    this.tutorialUI.hide()
    this.saveProgress()
    
    if (this.onSkip) {
      this.onSkip()
    }
    
    console.log('⏭️ Tutorial skipped')
  }

  /**
   * 次のステップに進む
   */
  public nextStep(): void {
    if (!this.isActive) return

    const currentStep = this.steps[this.currentStepIndex]
    if (currentStep?.afterStep) {
      currentStep.afterStep()
    }

    this.currentStepIndex++
    
    if (this.currentStepIndex >= this.steps.length) {
      this.completeTutorial()
    } else {
      this.showCurrentStep()
    }
  }

  /**
   * 前のステップに戻る
   */
  public previousStep(): void {
    if (!this.isActive || this.currentStepIndex <= 0) return

    this.currentStepIndex--
    this.showCurrentStep()
  }

  /**
   * 特定のステップにジャンプ
   */
  public goToStep(stepIndex: number): void {
    if (!this.isActive || stepIndex < 0 || stepIndex >= this.steps.length) return

    this.currentStepIndex = stepIndex
    this.showCurrentStep()
  }

  /**
   * 現在のステップを表示
   */
  private showCurrentStep(): void {
    const step = this.steps[this.currentStepIndex]
    if (!step) return

    if (step.beforeStep) {
      step.beforeStep()
    }

    this.tutorialUI.showStep(step, this.currentStepIndex, this.steps.length)
    
    // 自動進行条件チェック
    if (step.skipCondition && step.skipCondition()) {
      setTimeout(() => this.nextStep(), 500)
    }

    console.log(`📖 Showing tutorial step ${this.currentStepIndex + 1}/${this.steps.length}: ${step.title}`)
  }

  /**
   * チュートリアル完了
   */
  private completeTutorial(): void {
    this.isActive = false
    this.isCompleted = true
    this.endTime = Date.now()
    
    this.tutorialUI.showCompletion()
    this.saveProgress()
    
    if (this.onComplete) {
      this.onComplete()
    }
    
    const duration = this.endTime - (this.startTime || 0)
    console.log(`🎉 Tutorial completed in ${Math.round(duration / 1000)}s`)
  }

  /**
   * アクション完了通知
   */
  public notifyActionCompleted(action: string, data?: any): void {
    if (!this.isActive) return

    const currentStep = this.steps[this.currentStepIndex]
    if (!currentStep) return

    // アクションタイプチェック
    let shouldProgress = false

    switch (currentStep.action) {
      case 'build':
        if (action === 'tower-built' && 
            (!currentStep.actionData?.towerType || data?.towerType === currentStep.actionData.towerType)) {
          shouldProgress = true
        }
        break
      
      case 'upgrade':
        if (action === 'tower-upgraded') {
          shouldProgress = true
        }
        break
      
      case 'click':
        if (action === 'element-clicked' && 
            (!currentStep.targetElement || data?.element === currentStep.targetElement)) {
          shouldProgress = true
        }
        break
    }

    if (shouldProgress) {
      console.log(`✅ Tutorial action completed: ${action}`)
      setTimeout(() => this.nextStep(), 800)
    }
  }

  /**
   * 進行状況を保存
   */
  private saveProgress(): void {
    const progress: TutorialProgress = {
      completed: this.isCompleted,
      currentStepIndex: this.currentStepIndex,
      skipped: this.isSkipped,
      ...(this.startTime !== undefined && { startTime: this.startTime }),
      ...(this.endTime !== undefined && { endTime: this.endTime })
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress))
      console.log('💾 Tutorial progress saved')
    } catch (error) {
      console.warn('⚠️ Failed to save tutorial progress:', error)
    }
  }

  /**
   * 進行状況を読み込み
   */
  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (saved) {
        const progress: TutorialProgress = JSON.parse(saved)
        this.isCompleted = progress.completed
        this.currentStepIndex = progress.currentStepIndex
        this.isSkipped = progress.skipped
        this.startTime = progress.startTime
        this.endTime = progress.endTime
        
        console.log('📁 Tutorial progress loaded:', progress)
      }
    } catch (error) {
      console.warn('⚠️ Failed to load tutorial progress:', error)
    }
  }

  /**
   * 初回プレイヤーかチェック
   */
  public isFirstTimePlayer(): boolean {
    return !this.isCompleted && !this.isSkipped
  }

  /**
   * チュートリアル再開が必要かチェック
   */
  private shouldRestartTutorial(): boolean {
    // 30日経過で再チュートリアル提案
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
    const lastCompletion = this.endTime || 0
    return Date.now() - lastCompletion > THIRTY_DAYS
  }

  /**
   * チュートリアル進行状況をリセット
   */
  public resetProgress(): void {
    this.isCompleted = false
    this.isSkipped = false
    this.currentStepIndex = 0
    this.startTime = undefined
    this.endTime = undefined
    
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('🗑️ Tutorial progress reset')
    } catch (error) {
      console.warn('⚠️ Failed to reset tutorial progress:', error)
    }
  }

  // ゲッター・セッター
  public isActiveStatus(): boolean { return this.isActive }
  public isCompletedStatus(): boolean { return this.isCompleted }
  public getCurrentStepIndex(): number { return this.currentStepIndex }
  public getTotalSteps(): number { return this.steps.length }
  public getCurrentStep(): TutorialStep | null { return this.steps[this.currentStepIndex] || null }

  public setOnComplete(callback: () => void): void { this.onComplete = callback }
  public setOnSkip(callback: () => void): void { this.onSkip = callback }

  /**
   * リソースクリーンアップ
   */
  public destroy(): void {
    this.isActive = false
    this.tutorialUI.destroy()
    console.log('🗑️ TutorialSystem destroyed')
  }
}