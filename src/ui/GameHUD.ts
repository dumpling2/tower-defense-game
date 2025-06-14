import { GameState } from '@/game/GameState'
import { WaveSystem } from '@/systems/WaveSystem'
import { EconomySystem } from '@/game/EconomySystem'

/**
 * ゲームHUD（ヘッドアップディスプレイ）
 * 画面上部に常時表示される基本ゲーム情報
 */
export class GameHUD {
  private gameState: GameState
  private waveSystem: WaveSystem
  private economySystem: EconomySystem
  private hudElement: HTMLElement | null = null
  private updateInterval: number | null = null

  constructor(gameState: GameState, waveSystem: WaveSystem, economySystem: EconomySystem) {
    this.gameState = gameState
    this.waveSystem = waveSystem
    this.economySystem = economySystem
    this.createHUD()
    this.startUpdating()
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
      </div>
    `

    // HTMLを追加
    const hudContainer = document.createElement('div')
    hudContainer.innerHTML = hudHTML
    document.body.appendChild(hudContainer)

    this.hudElement = document.getElementById('game-hud')
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