import { Game } from '@/game/Game'
import { WaveSystem } from '@/systems/WaveSystem'

export type GameSpeed = 0 | 1 | 2 | 3

/**
 * プレイヤーUI
 * ゲーム制御ボタン（一時停止、速度変更、次ウェーブ開始）
 */
export class PlayerUI {
  private game: Game
  private waveSystem: WaveSystem
  private panel: HTMLElement | null = null
  private isPaused: boolean = false
  // private gameSpeed: GameSpeed = 1  // 将来的にゲーム速度情報が必要な場合用
  private updateInterval: number | null = null

  constructor(game: Game, waveSystem: WaveSystem) {
    this.game = game
    this.waveSystem = waveSystem
    this.createUI()
    this.setupEventListeners()
    this.startUpdating()
  }

  private createUI(): void {
    const panelHTML = `
      <div id="player-control-panel" class="player-control-panel">
        <!-- ゲーム速度制御 -->
        <div class="control-section speed-control">
          <div class="control-label">ゲーム速度</div>
          <div class="speed-buttons">
            <button id="pause-btn" class="control-btn pause-btn" title="一時停止 (Space)">
              <span class="btn-icon">⏸️</span>
            </button>
            <button id="speed-1x" class="control-btn speed-btn active" data-speed="1" title="通常速度">
              1x
            </button>
            <button id="speed-2x" class="control-btn speed-btn" data-speed="2" title="2倍速">
              2x
            </button>
            <button id="speed-3x" class="control-btn speed-btn" data-speed="3" title="3倍速">
              3x
            </button>
          </div>
        </div>

        <!-- ウェーブ制御 -->
        <div class="control-section wave-control">
          <button id="start-wave-btn" class="control-btn primary large" title="次のウェーブを開始">
            <span class="btn-icon">▶️</span>
            <span class="btn-text">次ウェーブ開始</span>
          </button>
          <div id="wave-timer" class="wave-timer hidden">
            <span class="timer-label">自動開始まで:</span>
            <span id="wave-countdown" class="timer-value">10</span>
          </div>
        </div>

        <!-- ゲームメニュー -->
        <div class="control-section menu-control">
          <button id="menu-btn" class="control-btn menu-btn" title="メニュー">
            <span class="btn-icon">☰</span>
          </button>
        </div>

        <!-- ショートカットヒント -->
        <div class="shortcuts-hint">
          <div class="shortcut">
            <kbd>Space</kbd> 一時停止
          </div>
          <div class="shortcut">
            <kbd>1-3</kbd> 速度変更
          </div>
          <div class="shortcut">
            <kbd>Enter</kbd> 次ウェーブ
          </div>
        </div>
      </div>
    `

    // HTMLを追加
    const panelContainer = document.createElement('div')
    panelContainer.innerHTML = panelHTML
    document.body.appendChild(panelContainer)

    this.panel = document.getElementById('player-control-panel')
  }

  private setupEventListeners(): void {
    // 一時停止ボタン
    document.getElementById('pause-btn')?.addEventListener('click', () => {
      this.togglePause()
    })

    // 速度変更ボタン
    const speedButtons = document.querySelectorAll('.speed-btn')
    speedButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseInt((e.target as HTMLElement).dataset.speed || '1') as GameSpeed
        this.setGameSpeed(speed)
      })
    })

    // 次ウェーブ開始ボタン
    document.getElementById('start-wave-btn')?.addEventListener('click', () => {
      this.startNextWave()
    })

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      // スペースキーで一時停止
      if (e.code === 'Space') {
        e.preventDefault()
        this.togglePause()
      }
      
      // 数字キーで速度変更
      if (e.key >= '0' && e.key <= '3') {
        const speed = parseInt(e.key) as GameSpeed
        this.setGameSpeed(speed)
      }
      
      // Enterキーで次ウェーブ
      if (e.key === 'Enter') {
        e.preventDefault()
        this.startNextWave()
      }
    })
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused
    const pauseBtn = document.getElementById('pause-btn')
    
    if (this.isPaused) {
      this.setGameSpeed(0)
      pauseBtn?.classList.add('active')
      if (pauseBtn) {
        pauseBtn.innerHTML = '<span class="btn-icon">▶️</span>'
      }
    } else {
      this.setGameSpeed(1)
      pauseBtn?.classList.remove('active')
      if (pauseBtn) {
        pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span>'
      }
    }
  }

  private setGameSpeed(speed: GameSpeed): void {
    // this.gameSpeed = speed  // 将来的に使用する可能性がある
    
    // PixiJSのticker速度を変更
    const app = this.game.getApp()
    if (app) {
      app.ticker.speed = speed
    }

    // ボタンの状態を更新
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    
    if (speed > 0) {
      document.querySelector(`[data-speed="${speed}"]`)?.classList.add('active')
      this.isPaused = false
      const pauseBtn = document.getElementById('pause-btn')
      pauseBtn?.classList.remove('active')
      if (pauseBtn) {
        pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span>'
      }
    }
  }

  private startNextWave(): void {
    const waveProgress = this.waveSystem.getWaveProgress()
    
    // 準備中または完了状態の時のみ次ウェーブを開始
    if (waveProgress.status === 'preparing' || waveProgress.status === 'completed') {
      this.waveSystem.forceStartNextWave()
      
      // ボタンにフィードバック
      const btn = document.getElementById('start-wave-btn')
      btn?.classList.add('activated')
      setTimeout(() => btn?.classList.remove('activated'), 300)
    }
  }

  private startUpdating(): void {
    this.updateInterval = window.setInterval(() => this.updateUI(), 100)
    this.updateUI()
  }

  private updateUI(): void {
    const waveProgress = this.waveSystem.getWaveProgress()
    const startBtn = document.getElementById('start-wave-btn') as HTMLButtonElement
    const waveTimer = document.getElementById('wave-timer')
    const countdown = document.getElementById('wave-countdown')

    // ウェーブ開始ボタンの状態
    if (waveProgress.status === 'active') {
      startBtn.disabled = true
      startBtn.innerHTML = `
        <span class="btn-icon">⚔️</span>
        <span class="btn-text">ウェーブ ${waveProgress.waveNumber} 進行中</span>
      `
      waveTimer?.classList.add('hidden')
    } else if (waveProgress.status === 'preparing') {
      startBtn.disabled = false
      startBtn.innerHTML = `
        <span class="btn-icon">▶️</span>
        <span class="btn-text">ウェーブ ${waveProgress.waveNumber + 1} 開始</span>
      `
      
      // カウントダウン表示
      if (waveProgress.nextWaveIn > 0) {
        waveTimer?.classList.remove('hidden')
        if (countdown) {
          countdown.textContent = Math.ceil(waveProgress.nextWaveIn / 1000).toString()
        }
      } else {
        waveTimer?.classList.add('hidden')
      }
    } else if (waveProgress.status === 'completed') {
      startBtn.disabled = false
      startBtn.innerHTML = `
        <span class="btn-icon">▶️</span>
        <span class="btn-text">次ウェーブ開始</span>
      `
      waveTimer?.classList.add('hidden')
    }
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    if (this.panel) {
      this.panel.remove()
      this.panel = null
    }
  }
}