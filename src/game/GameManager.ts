import { Application } from 'pixi.js'
import { Game } from './Game'
import { GameStateManager } from './GameStateManager'
import { MainMenu } from '@/ui/MainMenu'
import { SettingsMenu } from '@/ui/SettingsMenu'

export class GameManager {
  private app: Application
  private gameStateManager: GameStateManager
  private game: Game | null = null
  private mainMenu: MainMenu | null = null
  private settingsMenu: SettingsMenu | null = null
  
  constructor(app: Application) {
    this.app = app
    this.gameStateManager = new GameStateManager()
    
    // 状態変化のリスナーを追加
    this.gameStateManager.addListener({
      onStateChanged: (oldState, newState) => {
        this.handleStateChange(oldState, newState)
      }
    })
    
    this.initializeMenus()
    this.showMainMenu()
  }

  private initializeMenus(): void {
    console.log('🏗️ Initializing menus...')
    
    // メインメニューの初期化
    this.mainMenu = new MainMenu(
      () => {
        console.log('🎮 Start game callback triggered!')
        this.startGame()
      },
      () => {
        console.log('⚙️ Settings callback triggered!')
        this.openSettings()
      },
      () => {
        console.log('🚪 Exit callback triggered!')
        this.exitGame()
      },
      () => {
        console.log('🎓 Tutorial callback triggered!')
        this.startTutorial()
      }
    )

    // 設定メニューの初期化
    this.settingsMenu = new SettingsMenu(
      () => this.returnToMainMenu()
    )
    
    console.log('✅ Menus initialized successfully')
  }

  private handleStateChange(oldState: string, newState: string): void {
    console.log(`🎮 Handling state change: ${oldState} → ${newState}`)

    // 前の状態のクリーンアップ
    switch (oldState) {
      case 'menu':
        this.hideMainMenu()
        break
      case 'settings':
        this.hideSettings()
        break
      case 'playing':
      case 'paused':
        this.hideGame()
        break
    }

    // 新しい状態の初期化
    switch (newState) {
      case 'menu':
        this.showMainMenu()
        break
      case 'settings':
        this.showSettings()
        break
      case 'playing':
        this.showGame()
        break
      case 'gameOver':
        // ゲームオーバーはGame.tsで処理される
        break
    }
  }

  private startGame(): void {
    console.log('🚀 Starting new game...')
    this.gameStateManager.setState('playing')
  }

  private openSettings(): void {
    console.log('⚙️ Opening settings...')
    this.gameStateManager.setState('settings')
  }

  private exitGame(): void {
    console.log('🚪 Exiting game...')
    if (confirm('ゲームを終了しますか？')) {
      // ブラウザでは実際の終了はできないので、メニューに戻る
      this.returnToMainMenu()
    }
  }

  private returnToMainMenu(): void {
    console.log('🏠 Returning to main menu...')
    this.gameStateManager.setState('menu')
  }

  private showMainMenu(): void {
    console.log('🏠 Attempting to show main menu...')
    if (this.mainMenu) {
      try {
        this.mainMenu.show()
        console.log('✅ Main menu show() called successfully')
        
        // デバッグ: DOM要素の存在確認
        setTimeout(() => {
          const overlay = document.getElementById('main-menu-overlay')
          const startBtn = document.getElementById('start-game-btn')
          console.log('🔍 Debug check:')
          console.log('  - Overlay exists:', !!overlay)
          console.log('  - Overlay visible:', overlay?.style.display)
          console.log('  - Start button exists:', !!startBtn)
          console.log('  - Start button clickable:', startBtn ? window.getComputedStyle(startBtn).pointerEvents : 'N/A')
          
          if (!overlay) {
            console.error('🚨 CRITICAL: Main menu overlay missing from DOM!')
            console.log('🔧 Attempting to recreate main menu...')
            this.initializeMenus()
          }
        }, 100)
      } catch (error) {
        console.error('❌ Error showing main menu:', error)
        console.log('🔧 Attempting to recreate main menu...')
        this.initializeMenus()
      }
    } else {
      console.error('❌ Main menu instance not found!')
      console.log('🔧 Attempting to recreate main menu...')
      this.initializeMenus()
    }
  }

  private hideMainMenu(): void {
    if (this.mainMenu) {
      this.mainMenu.hide()
    }
  }

  private showSettings(): void {
    if (this.settingsMenu) {
      this.settingsMenu.show()
    }
  }

  private hideSettings(): void {
    if (this.settingsMenu) {
      this.settingsMenu.hide()
    }
  }

  private showGame(): void {
    if (!this.game) {
      // 新しいゲームインスタンスを作成
      this.game = new Game(this.app)
      
      // ゲームオーバー時にメニューに戻るためのリスナーを追加
      this.setupGameEventListeners()
    }
    
    this.game.start()
  }

  private hideGame(): void {
    if (this.game) {
      this.game.stop()
    }
  }

  private setupGameEventListeners(): void {
    if (!this.game) return

    // ESCキーでメニューに戻る（ゲーム中のみ）
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.gameStateManager.isInGame()) {
        if (confirm('メインメニューに戻りますか？')) {
          this.returnToMainMenu()
        }
      }
    })
  }

  public pauseGame(): void {
    if (this.gameStateManager.canPause()) {
      this.gameStateManager.setState('paused')
      if (this.game) {
        this.game.stop()
      }
    }
  }

  public resumeGame(): void {
    if (this.gameStateManager.canResume()) {
      this.gameStateManager.setState('playing')
      if (this.game) {
        this.game.start()
      }
    }
  }

  public restartGame(): void {
    console.log('🔄 Restarting game...')
    
    // 現在のゲームインスタンスを破棄
    if (this.game) {
      this.game.destroy()
      this.game = null
    }
    
    // 新しいゲームを開始
    this.startGame()
  }

  public getGameStateManager(): GameStateManager {
    return this.gameStateManager
  }

  public getCurrentGame(): Game | null {
    return this.game
  }

  private startTutorial(): void {
    console.log('🎓 Starting tutorial mode...')
    
    // ゲームを開始（チュートリアル付き）
    this.gameStateManager.setState('playing')
    
    // ゲームが初期化された後にチュートリアルを開始
    setTimeout(() => {
      if (this.game) {
        this.game.startTutorial()
      }
    }, 500)
  }

  public destroy(): void {
    console.log('🗑️ Destroying GameManager...')
    
    // ゲームインスタンスを破棄
    if (this.game) {
      this.game.destroy()
      this.game = null
    }
    
    // メニューを破棄
    if (this.mainMenu) {
      this.mainMenu.destroy()
      this.mainMenu = null
    }
    
    if (this.settingsMenu) {
      this.settingsMenu.destroy()
      this.settingsMenu = null
    }
  }
}