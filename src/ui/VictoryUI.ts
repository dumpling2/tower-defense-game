import { VictoryStats } from '@/systems/VictorySystem'

/**
 * 勝利画面UI管理クラス
 * ゲームオーバー処理と同じパターンで勝利時の表示を管理
 */
export class VictoryUI {
  private container: HTMLElement | null = null
  private onRestart?: () => void
  private onMainMenu?: () => void
  private onShowResults?: () => void

  constructor() {
    this.createVictoryOverlay()
  }

  /**
   * 勝利オーバーレイHTMLを作成
   */
  private createVictoryOverlay(): void {
    const victoryHTML = `
      <div id="victory-overlay" class="victory-overlay" style="display: none;">
        <div class="victory-content">
          <!-- 勝利メッセージ -->
          <div class="victory-header">
            <h1 class="victory-title">🏆 VICTORY! 🏆</h1>
            <p class="victory-subtitle">ゲームクリア！おめでとうございます！</p>
          </div>
          
          <!-- 勝利統計 -->
          <div class="victory-stats">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">クリア時間</span>
                <span class="stat-value" id="victory-clear-time">--:--</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">生存率</span>
                <span class="stat-value" id="victory-survival-rate">100%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">ウェーブ数</span>
                <span class="stat-value" id="victory-waves-completed">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">命中率</span>
                <span class="stat-value" id="victory-accuracy">0%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最終スコア</span>
                <span class="stat-value" id="victory-final-score">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">残り資金</span>
                <span class="stat-value" id="victory-money-remaining">0</span>
              </div>
            </div>
          </div>

          <!-- 達成条件 -->
          <div class="victory-conditions">
            <h3>🎯 達成した条件</h3>
            <div id="victory-conditions-list" class="conditions-list">
              <!-- 動的に生成 -->
            </div>
          </div>

          <!-- 評価とボーナス -->
          <div class="victory-evaluation">
            <div class="evaluation-badge" id="victory-evaluation-badge">
              <span class="evaluation-rank" id="victory-rank">S</span>
              <span class="evaluation-text" id="victory-evaluation">完璧なクリア!</span>
            </div>
          </div>

          <!-- アクションボタン -->
          <div class="victory-actions">
            <button id="victory-show-results-btn" class="victory-btn secondary">
              📊 詳細結果
            </button>
            <button id="victory-restart-btn" class="victory-btn primary">
              🔄 再プレイ
            </button>
            <button id="victory-main-menu-btn" class="victory-btn tertiary">
              🏠 メニューに戻る
            </button>
          </div>
        </div>
      </div>
    `

    const container = document.createElement('div')
    container.innerHTML = victoryHTML
    document.body.appendChild(container)
    this.container = container

    this.setupEventListeners()
    this.setupStyles()
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    // 再プレイボタン
    document.getElementById('victory-restart-btn')?.addEventListener('click', () => {
      this.hide()
      this.onRestart?.()
    })

    // メインメニューボタン
    document.getElementById('victory-main-menu-btn')?.addEventListener('click', () => {
      this.hide()
      this.onMainMenu?.()
    })

    // 詳細結果ボタン
    document.getElementById('victory-show-results-btn')?.addEventListener('click', () => {
      this.onShowResults?.()
    })

    // ESCキーで閉じる
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible()) {
        this.hide()
        this.onRestart?.()
      }
    })
  }

  /**
   * CSSスタイルを設定
   */
  private setupStyles(): void {
    const styles = `
      <style>
        .victory-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.95), rgba(39, 174, 96, 0.95));
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          backdrop-filter: blur(10px);
          opacity: 0;
          transition: opacity 0.5s ease-in-out;
        }

        .victory-overlay.show {
          opacity: 1;
        }

        .victory-content {
          background: linear-gradient(135deg, #ffffff, #f8f9fa);
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          transform: scale(0.9);
          transition: transform 0.3s ease-out;
        }

        .victory-overlay.show .victory-content {
          transform: scale(1);
        }

        /* ヘッダー */
        .victory-header {
          margin-bottom: 30px;
        }

        .victory-title {
          font-size: 3rem;
          color: #27ae60;
          margin: 0 0 10px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          animation: victory-bounce 2s ease-in-out infinite;
        }

        @keyframes victory-bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .victory-subtitle {
          font-size: 1.2rem;
          color: #2c3e50;
          margin: 0;
          opacity: 0.8;
        }

        /* 統計グリッド */
        .victory-stats {
          margin: 30px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .stat-item {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border-radius: 12px;
          padding: 15px;
          border: 2px solid rgba(46, 204, 113, 0.2);
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(46, 204, 113, 0.3);
          border-color: rgba(46, 204, 113, 0.5);
        }

        .stat-label {
          display: block;
          font-size: 0.9rem;
          color: #6c757d;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          color: #27ae60;
          font-weight: bold;
        }

        /* 達成条件 */
        .victory-conditions {
          margin: 30px 0;
          text-align: left;
        }

        .victory-conditions h3 {
          color: #2c3e50;
          text-align: center;
          margin-bottom: 20px;
        }

        .conditions-list {
          background: rgba(46, 204, 113, 0.1);
          border-radius: 12px;
          padding: 20px;
        }

        .condition-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          padding: 10px;
          background: white;
          border-radius: 8px;
          border-left: 4px solid #27ae60;
        }

        .condition-item:last-child {
          margin-bottom: 0;
        }

        .condition-icon {
          margin-right: 10px;
          font-size: 1.2rem;
        }

        .condition-text {
          flex: 1;
          color: #2c3e50;
          font-weight: 500;
        }

        .condition-status {
          color: #27ae60;
          font-weight: bold;
        }

        /* 評価バッジ */
        .victory-evaluation {
          margin: 30px 0;
        }

        .evaluation-badge {
          display: inline-flex;
          align-items: center;
          gap: 15px;
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          padding: 15px 30px;
          border-radius: 50px;
          font-weight: bold;
          box-shadow: 0 8px 25px rgba(243, 156, 18, 0.3);
        }

        .evaluation-rank {
          font-size: 2rem;
          background: white;
          color: #f39c12;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .evaluation-text {
          font-size: 1.1rem;
        }

        /* アクションボタン */
        .victory-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .victory-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
          justify-content: center;
        }

        .victory-btn.primary {
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
          box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
        }

        .victory-btn.primary:hover {
          background: linear-gradient(135deg, #2ecc71, #27ae60);
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(46, 204, 113, 0.5);
        }

        .victory-btn.secondary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }

        .victory-btn.secondary:hover {
          background: linear-gradient(135deg, #2980b9, #21618c);
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(52, 152, 219, 0.5);
        }

        .victory-btn.tertiary {
          background: linear-gradient(135deg, #95a5a6, #7f8c8d);
          color: white;
          box-shadow: 0 4px 15px rgba(149, 165, 166, 0.3);
        }

        .victory-btn.tertiary:hover {
          background: linear-gradient(135deg, #7f8c8d, #6c7b7d);
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(149, 165, 166, 0.5);
        }

        /* レスポンシブデザイン */
        @media (max-width: 768px) {
          .victory-content {
            padding: 30px 20px;
            width: 95%;
          }

          .victory-title {
            font-size: 2.5rem;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
          }

          .victory-actions {
            flex-direction: column;
            align-items: center;
          }

          .victory-btn {
            width: 100%;
            max-width: 250px;
          }
        }

        /* スクロールバー */
        .victory-content::-webkit-scrollbar {
          width: 8px;
        }

        .victory-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .victory-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          border-radius: 4px;
        }

        .victory-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2ecc71, #27ae60);
        }
      </style>
    `

    // スタイルが既に存在しない場合のみ追加
    if (!document.getElementById('victory-ui-styles')) {
      const styleElement = document.createElement('div')
      styleElement.id = 'victory-ui-styles'
      styleElement.innerHTML = styles
      document.head.appendChild(styleElement)
    }
  }

  /**
   * 勝利画面を表示
   */
  public show(stats: VictoryStats, conditions: Array<{description: string, completed: boolean}>): void {
    const overlay = document.getElementById('victory-overlay')
    if (!overlay) return

    // 統計データを更新
    this.updateStats(stats)
    
    // 達成条件を更新
    this.updateConditions(conditions)
    
    // 評価を更新
    this.updateEvaluation(stats)

    // 表示アニメーション
    overlay.style.display = 'flex'
    setTimeout(() => {
      overlay.classList.add('show')
    }, 50)

    console.log('🏆 Victory screen displayed')
  }

  /**
   * 統計データを更新
   */
  private updateStats(stats: VictoryStats): void {
    // クリア時間
    const minutes = Math.floor(stats.clearTime / 60000)
    const seconds = Math.floor((stats.clearTime % 60000) / 1000)
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`
    this.updateElement('victory-clear-time', timeText)

    // 生存率
    const survivalRate = Math.round(stats.survivalRate * 100)
    this.updateElement('victory-survival-rate', `${survivalRate}%`)

    // ウェーブ数
    this.updateElement('victory-waves-completed', stats.wavesCompleted.toString())

    // 命中率
    const accuracy = Math.round(stats.accuracy * 100)
    this.updateElement('victory-accuracy', `${accuracy}%`)

    // 最終スコア
    this.updateElement('victory-final-score', stats.finalScore.toString())

    // 残り資金
    this.updateElement('victory-money-remaining', `${stats.moneyRemaining}G`)
  }

  /**
   * 達成条件を更新
   */
  private updateConditions(conditions: Array<{description: string, completed: boolean}>): void {
    const container = document.getElementById('victory-conditions-list')
    if (!container) return

    const completedConditions = conditions.filter(c => c.completed)
    
    container.innerHTML = completedConditions.map(condition => `
      <div class="condition-item">
        <span class="condition-icon">✅</span>
        <span class="condition-text">${condition.description}</span>
        <span class="condition-status">達成</span>
      </div>
    `).join('')
  }

  /**
   * 評価を更新
   */
  private updateEvaluation(stats: VictoryStats): void {
    let rank = 'A'
    let evaluation = '素晴らしいクリア!'

    // 評価計算
    const score = this.calculateEvaluationScore(stats)
    
    if (score >= 95) {
      rank = 'S+'
      evaluation = '完璧すぎるクリア!'
    } else if (score >= 90) {
      rank = 'S'
      evaluation = '完璧なクリア!'
    } else if (score >= 80) {
      rank = 'A'
      evaluation = '素晴らしいクリア!'
    } else if (score >= 70) {
      rank = 'B'
      evaluation = '良いクリア!'
    } else if (score >= 60) {
      rank = 'C'
      evaluation = 'クリア!'
    } else {
      rank = 'D'
      evaluation = 'なんとかクリア...'
    }

    this.updateElement('victory-rank', rank)
    this.updateElement('victory-evaluation', evaluation)
  }

  /**
   * 評価スコアを計算
   */
  private calculateEvaluationScore(stats: VictoryStats): number {
    let score = 50 // ベーススコア

    // 生存率 (30点満点)
    score += stats.survivalRate * 30

    // 命中率 (20点満点)
    score += stats.accuracy * 20

    // パーフェクトクリアボーナス
    if (stats.perfectClear) {
      score += 10
    }

    // 時間ボーナス（速いほど高得点、15分以下で満点）
    const timeMinutes = stats.clearTime / 60000
    if (timeMinutes <= 15) {
      score += 10
    } else if (timeMinutes <= 20) {
      score += 5
    }

    return Math.min(100, Math.round(score))
  }

  /**
   * HTML要素のテキストを更新
   */
  private updateElement(id: string, text: string): void {
    const element = document.getElementById(id)
    if (element) {
      element.textContent = text
    }
  }

  /**
   * 勝利画面を非表示
   */
  public hide(): void {
    const overlay = document.getElementById('victory-overlay')
    if (!overlay) return

    overlay.classList.remove('show')
    setTimeout(() => {
      overlay.style.display = 'none'
    }, 500)

    console.log('🏆 Victory screen hidden')
  }

  /**
   * 勝利画面が表示されているかチェック
   */
  public isVisible(): boolean {
    const overlay = document.getElementById('victory-overlay')
    return overlay ? overlay.style.display !== 'none' : false
  }

  /**
   * コールバック設定
   */
  public setOnRestart(callback: () => void): void {
    this.onRestart = callback
  }

  public setOnMainMenu(callback: () => void): void {
    this.onMainMenu = callback
  }

  public setOnShowResults(callback: () => void): void {
    this.onShowResults = callback
  }

  /**
   * リソースクリーンアップ
   */
  public destroy(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
    
    const styles = document.getElementById('victory-ui-styles')
    if (styles) {
      styles.remove()
    }

    console.log('🗑️ Victory UI destroyed')
  }
}