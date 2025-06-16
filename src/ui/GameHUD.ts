import { GameState } from '@/game/GameState'
import { WaveSystem } from '@/systems/WaveSystem'
import { EconomySystem } from '@/game/EconomySystem'
import { VictorySystem } from '@/systems/VictorySystem'

/**
 * ゲームHUD（ヘッドアップディスプレイ）
 * 画面上部に常時表示される基本ゲーム情報
 */
export class GameHUD {
  private gameState: GameState
  private waveSystem: WaveSystem
  private economySystem: EconomySystem
  private victorySystem: VictorySystem | null = null
  private hudElement: HTMLElement | null = null
  private updateInterval: number | null = null

  constructor(gameState: GameState, waveSystem: WaveSystem, economySystem: EconomySystem) {
    this.gameState = gameState
    this.waveSystem = waveSystem
    this.economySystem = economySystem
    this.createHUD()
    this.startUpdating()
  }

  /**
   * 勝利システムを設定（ゲーム開始後に呼び出される）
   */
  public setVictorySystem(victorySystem: VictorySystem): void {
    this.victorySystem = victorySystem
    // 勝利進捗セクションを表示
    const victorySection = document.getElementById('hud-victory-section')
    if (victorySection) {
      victorySection.style.display = 'block'
    }
  }

  private createHUD(): void {
    const hudHTML = `
      <div id="game-hud" class="game-hud">
        <div class="hud-section resources">
          <div class="hud-item">
            <span class="hud-icon">💰</span>
            <span class="hud-label">資金:</span>
            <span id="hud-money" class="hud-value">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-icon">❤️</span>
            <span class="hud-label">ライフ:</span>
            <span id="hud-lives" class="hud-value">20</span>
          </div>
        </div>

        <div class="hud-section wave-info">
          <div class="hud-item">
            <span class="hud-icon">🌊</span>
            <span class="hud-label">ウェーブ:</span>
            <span id="hud-wave" class="hud-value">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-icon">👹</span>
            <span class="hud-label">敵残数:</span>
            <span id="hud-enemies" class="hud-value">0</span>
          </div>
          <div class="hud-item" id="hud-countdown-container">
            <span class="hud-icon">⏱️</span>
            <span class="hud-label">次ウェーブ:</span>
            <span id="hud-countdown" class="hud-value">-</span>
          </div>
        </div>

        <div class="hud-section special-resources">
          <div class="hud-item">
            <span class="hud-icon">💎</span>
            <span id="hud-crystal" class="hud-value-small">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-icon">🔬</span>
            <span id="hud-research" class="hud-value-small">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-icon">⚡</span>
            <span id="hud-energy" class="hud-value-small">0</span>
          </div>
        </div>

        <div class="hud-section victory-progress" id="hud-victory-section" style="display: none;">
          <div class="hud-item victory-item">
            <span class="hud-icon">🏆</span>
            <span class="hud-label">勝利進捗:</span>
            <div class="victory-progress-bar">
              <div id="hud-victory-progress" class="victory-progress-fill" style="width: 0%"></div>
            </div>
            <span id="hud-victory-text" class="hud-value-small">0/15</span>
          </div>
        </div>
      </div>
    `

    // HTMLを追加
    const hudContainer = document.createElement('div')
    hudContainer.innerHTML = hudHTML
    document.body.appendChild(hudContainer)

    this.hudElement = document.getElementById('game-hud')
    
    // 勝利進捗バーのスタイルを追加
    this.addVictoryProgressStyles()
  }

  private addVictoryProgressStyles(): void {
    // スタイルが既に存在する場合はスキップ
    if (document.getElementById('victory-progress-styles')) {
      return
    }

    const styles = `
      <style id="victory-progress-styles">
        .victory-progress {
          margin-top: 8px;
        }
        
        .victory-item {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 4px;
        }
        
        .victory-progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .victory-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #95a5a6, #7f8c8d);
          border-radius: 3px;
          transition: width 0.3s ease, background 0.3s ease;
          position: relative;
        }
        
        .victory-progress-fill:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shine 2s infinite;
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .hud-section.victory-progress {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: 8px;
          margin-top: 8px;
        }
      </style>
    `

    document.head.insertAdjacentHTML('beforeend', styles)
  }

  private startUpdating(): void {
    // 60FPSで更新
    this.updateInterval = window.setInterval(() => this.updateHUD(), 16)
    
    // 初回更新
    this.updateHUD()
  }

  private updateHUD(): void {
    // 基本リソース
    const money = document.getElementById('hud-money')
    const lives = document.getElementById('hud-lives')
    if (money) money.textContent = Math.floor(this.gameState.getMoney()).toString()
    if (lives) lives.textContent = this.gameState.getLives().toString()

    // 特殊通貨
    const currencies = this.economySystem.getAllCurrencies()
    const crystal = document.getElementById('hud-crystal')
    const research = document.getElementById('hud-research')
    const energy = document.getElementById('hud-energy')
    if (crystal) crystal.textContent = Math.floor(currencies.crystal).toString()
    if (research) research.textContent = Math.floor(currencies.research).toString()
    if (energy) energy.textContent = Math.floor(currencies.energy).toString()

    // ウェーブ情報
    const waveProgress = this.waveSystem.getWaveProgress()
    const wave = document.getElementById('hud-wave')
    const enemies = document.getElementById('hud-enemies')
    const countdown = document.getElementById('hud-countdown')
    const countdownContainer = document.getElementById('hud-countdown-container')

    if (wave) wave.textContent = waveProgress.waveNumber.toString()
    if (enemies) enemies.textContent = waveProgress.enemiesRemaining.toString()
    
    if (countdown && countdownContainer) {
      if (waveProgress.status === 'preparing' && waveProgress.nextWaveIn > 0) {
        countdownContainer.style.display = 'flex'
        countdown.textContent = Math.ceil(waveProgress.nextWaveIn / 1000).toString() + '秒'
      } else {
        countdownContainer.style.display = 'none'
      }
    }

    // ライフが少ない時の警告
    if (this.gameState.getLives() <= 5) {
      lives?.classList.add('critical')
    } else {
      lives?.classList.remove('critical')
    }

    // 勝利進捗の更新
    this.updateVictoryProgress()
  }

  private updateVictoryProgress(): void {
    if (!this.victorySystem) return

    const mainCondition = this.victorySystem.getMainCondition()
    if (!mainCondition) return

    const progress = mainCondition.checkProgress()
    const currentWave = this.waveSystem.getCurrentWave()
    const targetWave = mainCondition.targetValue

    // 進捗バーを更新
    const progressBar = document.getElementById('hud-victory-progress')
    if (progressBar) {
      const percentage = Math.round(progress * 100)
      progressBar.style.width = `${percentage}%`
      
      // 進捗に応じて色を変更
      if (percentage >= 100) {
        progressBar.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)'
      } else if (percentage >= 75) {
        progressBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)'
      } else if (percentage >= 50) {
        progressBar.style.background = 'linear-gradient(90deg, #3498db, #2980b9)'
      } else {
        progressBar.style.background = 'linear-gradient(90deg, #95a5a6, #7f8c8d)'
      }
    }

    // 進捗テキストを更新
    const progressText = document.getElementById('hud-victory-text')
    if (progressText) {
      progressText.textContent = `${currentWave}/${targetWave}`
    }
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    
    if (this.hudElement) {
      this.hudElement.remove()
      this.hudElement = null
    }
  }
}