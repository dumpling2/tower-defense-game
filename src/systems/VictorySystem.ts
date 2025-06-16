import { GameState } from '@/game/GameState'
import { WaveSystem } from './WaveSystem'

/**
 * 勝利条件のタイプ定義
 */
export type VictoryConditionType = 
  | 'wave_survival'     // 指定ウェーブ数を生き残る
  | 'wave_clear'        // 指定ウェーブをクリア
  | 'score_target'      // 目標スコア達成
  | 'time_survival'     // 指定時間生存
  | 'perfect_defense'   // ライフを失わずにクリア

/**
 * 勝利条件の定義
 */
export interface VictoryCondition {
  id: string
  type: VictoryConditionType
  targetValue: number
  description: string
  checkProgress: () => number
  checkCompleted: () => boolean
  isMainCondition: boolean  // メイン勝利条件かサブ条件か
}

/**
 * 勝利時の統計情報
 */
export interface VictoryStats {
  conditionType: VictoryConditionType
  clearTime: number
  survivalRate: number
  efficiency: number
  perfectClear: boolean
  finalScore: number
  wavesCompleted: number
  enemiesKilled: number
  missileFired: number
  accuracy: number
  moneyRemaining: number
  livesRemaining: number
}

/**
 * 勝利条件管理システム
 * ゲームの勝利判定、条件チェック、勝利時処理を担当
 */
export class VictorySystem {
  private gameState: GameState
  private waveSystem: WaveSystem
  private conditions: VictoryCondition[] = []
  private gameStartTime: number = 0
  private victoryTriggered: boolean = false

  constructor(gameState: GameState, waveSystem: WaveSystem) {
    this.gameState = gameState
    this.waveSystem = waveSystem
    this.setupDefaultConditions()
  }

  /**
   * デフォルトの勝利条件を設定
   */
  private setupDefaultConditions(): void {
    // メイン勝利条件: ウェーブ15をクリア
    this.addCondition({
      id: 'main_wave_clear',
      type: 'wave_clear',
      targetValue: 15,
      description: 'ウェーブ15をクリア',
      checkProgress: () => Math.min(this.waveSystem.getCurrentWave() / 15, 1),
      checkCompleted: () => this.waveSystem.getCurrentWave() >= 15 && !this.waveSystem.isWaveActive(),
      isMainCondition: true
    })

    // サブ条件: パーフェクトディフェンス
    this.addCondition({
      id: 'perfect_defense',
      type: 'perfect_defense',
      targetValue: 20,
      description: 'ライフを失わずにクリア',
      checkProgress: () => this.gameState.getLives() / 20,
      checkCompleted: () => this.gameState.getLives() === 20,
      isMainCondition: false
    })

    // サブ条件: 高効率プレイ（精度80%以上）
    this.addCondition({
      id: 'high_efficiency',
      type: 'score_target',
      targetValue: 0.8,
      description: '命中率80%以上を維持',
      checkProgress: () => {
        const fired = this.gameState.getMissileFired()
        const killed = this.gameState.getEnemiesKilled()
        return fired > 0 ? Math.min(killed / fired, 1) : 0
      },
      checkCompleted: () => {
        const fired = this.gameState.getMissileFired()
        const killed = this.gameState.getEnemiesKilled()
        return fired >= 10 && killed / fired >= 0.8
      },
      isMainCondition: false
    })

    console.log('🏆 Victory conditions initialized:', this.conditions.length)
  }

  /**
   * ゲーム開始時の初期化
   */
  public initializeGame(): void {
    this.gameStartTime = Date.now()
    this.victoryTriggered = false
    console.log('🎮 Victory system initialized for new game')
  }

  /**
   * 勝利条件を追加
   */
  public addCondition(condition: VictoryCondition): void {
    this.conditions.push(condition)
    console.log(`🎯 Added victory condition: ${condition.description}`)
  }

  /**
   * 勝利条件チェック（毎フレーム実行）
   */
  public update(): void {
    if (this.victoryTriggered || this.gameState.getState() !== 'playing') {
      return
    }

    // メイン勝利条件をチェック
    const mainConditions = this.conditions.filter(c => c.isMainCondition)
    const completedMainConditions = mainConditions.filter(c => c.checkCompleted())

    if (completedMainConditions.length > 0) {
      this.triggerVictory()
    }
  }

  /**
   * 勝利を発動
   */
  private triggerVictory(): void {
    if (this.victoryTriggered) return

    this.victoryTriggered = true
    this.gameState.setState('victory')
    
    const stats = this.generateVictoryStats()
    console.log('🏆 VICTORY ACHIEVED!', stats)
    
    // 勝利イベントを発火（Game.tsで受け取る）
    this.onVictoryAchieved?.(stats)
  }

  /**
   * 勝利統計を生成
   */
  public generateVictoryStats(): VictoryStats {
    const clearTime = Date.now() - this.gameStartTime
    const fired = this.gameState.getMissileFired()
    const killed = this.gameState.getEnemiesKilled()
    const accuracy = fired > 0 ? killed / fired : 0
    const mainCondition = this.conditions.find(c => c.isMainCondition && c.checkCompleted())

    return {
      conditionType: mainCondition?.type || 'wave_clear',
      clearTime,
      survivalRate: this.gameState.getLives() / 20,
      efficiency: accuracy,
      perfectClear: this.gameState.getLives() === 20,
      finalScore: this.gameState.getScore(),
      wavesCompleted: this.waveSystem.getCurrentWave(),
      enemiesKilled: killed,
      missileFired: fired,
      accuracy,
      moneyRemaining: this.gameState.getMoney(),
      livesRemaining: this.gameState.getLives()
    }
  }

  /**
   * 勝利条件の進捗状況を取得
   */
  public getConditionProgress(): Array<{condition: VictoryCondition, progress: number, completed: boolean}> {
    return this.conditions.map(condition => ({
      condition,
      progress: condition.checkProgress(),
      completed: condition.checkCompleted()
    }))
  }

  /**
   * メイン勝利条件を取得
   */
  public getMainCondition(): VictoryCondition | undefined {
    return this.conditions.find(c => c.isMainCondition)
  }

  /**
   * サブ勝利条件を取得
   */
  public getSubConditions(): VictoryCondition[] {
    return this.conditions.filter(c => !c.isMainCondition)
  }

  /**
   * 勝利がトリガーされたかチェック
   */
  public isVictoryTriggered(): boolean {
    return this.victoryTriggered
  }

  /**
   * ゲームクリア時間を取得（秒）
   */
  public getClearTime(): number {
    return Math.round((Date.now() - this.gameStartTime) / 1000)
  }

  /**
   * 勝利イベントのコールバック
   */
  public onVictoryAchieved?: (stats: VictoryStats) => void

  /**
   * システムリセット
   */
  public reset(): void {
    this.victoryTriggered = false
    this.gameStartTime = 0
    // 条件は保持（デフォルト条件のみリセットする場合）
    console.log('🔄 Victory system reset')
  }

  /**
   * 完全リセット（条件も削除）
   */
  public fullReset(): void {
    this.reset()
    this.conditions = []
    this.setupDefaultConditions()
    console.log('🔄 Victory system fully reset')
  }
}