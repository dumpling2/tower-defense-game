import { Application } from 'pixi.js'
import { GameManager } from '@/game/GameManager'
import '@/ui/debug-ui.css'
import '@/ui/player-ui.css'
import '@/ui/main-menu.css'
import '@/ui/settings-menu.css'

// PixiJSアプリケーションの初期化
const app = new Application({
  width: 1200,
  height: 800,
  backgroundColor: 0x1a1a2e,
  antialias: true,
  // UI要素との適切な相互作用を確保
  eventMode: 'passive',
  eventFeatures: {
    move: true,
    globalMove: false,
    click: true,
    wheel: false
  }
})

// HTMLにキャンバスを追加
const gameContainer = document.getElementById('game-container')
if (!gameContainer) {
  throw new Error('Game container not found')
}
gameContainer.appendChild(app.view as HTMLCanvasElement)

// キャンバスのイベント設定を調整してUI操作を改善
const canvas = app.view as HTMLCanvasElement
canvas.style.position = 'relative'
canvas.style.zIndex = '0'  // UIより低いz-indexに設定
canvas.style.pointerEvents = 'auto'

// PixiJSステージのイベント設定
app.stage.eventMode = 'static'
app.stage.interactiveChildren = true

console.log('🎮 PixiJS Application initialized with UI-friendly settings')

// より安全なGameManager初期化
let gameManager: GameManager
let initializationAttempted = false

function initializeGameManager() {
  if (initializationAttempted) {
    console.log('⚠️ GameManager initialization already attempted')
    return
  }
  
  initializationAttempted = true
  console.log('🚀 Initializing GameManager...')
  
  try {
    gameManager = new GameManager(app)
    console.log('✅ GameManager initialized successfully')
    
    // 5秒後に自動デバッグ実行
    setTimeout(() => {
      console.log('🔍 Auto-running debug checks...')
      if ((window as any).debugMenu) {
        (window as any).debugMenu()
      }
    }, 5000)
    
  } catch (error) {
    console.error('❌ Failed to initialize GameManager:', error)
  }
}

// 複数のタイミングでの初期化を試行
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM Content Loaded event fired')
  setTimeout(initializeGameManager, 100) // 少し遅延して初期化
})

// DOMが既に読み込まれている場合
if (document.readyState === 'loading') {
  console.log('📄 DOM is still loading, waiting for DOMContentLoaded')
} else {
  console.log('📄 DOM already loaded, initializing immediately')
  setTimeout(initializeGameManager, 100) // 少し遅延して初期化
}

// 最後の手段として、windowのloadイベントでも試行
window.addEventListener('load', () => {
  console.log('🌐 Window load event fired')
  if (!gameManager) {
    console.log('🔧 Fallback: Initializing GameManager on window load')
    setTimeout(initializeGameManager, 200)
  }
})

// 開発時のデバッグ情報
if (import.meta.env.DEV) {
  console.log('🎮 Tower Defense Game Manager Started')
  console.log('📊 Canvas Size:', app.screen.width, 'x', app.screen.height)
  console.log('🏠 Starting in main menu mode')
  console.log('🌐 Browser info:', {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    devicePixelRatio: window.devicePixelRatio
  })
  
  // グローバルアクセス用（デバッグ）
  Object.defineProperty(window, 'gameManager', {
    get: () => {
      if (!gameManager) {
        console.warn('⚠️ GameManager not yet initialized')
      }
      return gameManager
    },
    enumerable: true
  })
  ;(window as any).app = app
  
  // ゲームインスタンスは動的に取得
  Object.defineProperty(window, 'game', {
    get: () => {
      const game = gameManager?.getCurrentGame()
      if (!game && gameManager) {
        console.warn('⚠️ Game instance not yet created')
      }
      return game
    },
    enumerable: true
  })
  
  // キーボードショートカット
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey) {
      switch (event.key) {
        case 'D':
          console.log('🔧 Debug shortcut activated')
          if ((window as any).debugMenu) {
            (window as any).debugMenu()
          }
          break
        case 'T':
          console.log('🧪 Test shortcut activated')
          if ((window as any).testMenuButtons) {
            (window as any).testMenuButtons()
          }
          break
        case 'E':
          console.log('🔧 Enable debug mode shortcut activated')
          if ((window as any).enableMenuDebug) {
            (window as any).enableMenuDebug()
          }
          break
      }
    }
  })
  
  // ページ読み込み完了後のヘルプメッセージ
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('\n🆘 === DEBUG HELP ===')
      console.log('Available debug commands:')
      console.log('  debugMenu() - Show detailed menu debug info')
      console.log('  testMenuButtons() - Test button click functionality')
      console.log('  enableMenuDebug() - Enable visual debug mode')
      console.log('  checkConflicts() - Check for event conflicts')
      console.log('  forceMenuClick() - Force trigger menu callbacks')
      console.log('  debugTowerPurchaseUI() - Debug tower purchase panel')
      console.log('  testTowerPurchaseButtons() - Test tower purchase buttons')
      console.log('  diagnoseClickability() - Diagnose UI button clickability issues')
      console.log('  debugTutorialButtons() - Debug tutorial button states')
      console.log('  forceTestTutorial() - Force start tutorial for testing')
      console.log('  emergencyTutorialFix() - Emergency tutorial system reset and fix')
      console.log('  testTutorialUIBlocking() - Test tutorial UI blocking functionality')
      console.log('\nKeyboard shortcuts:')
      console.log('  Ctrl+Shift+D - Run debug')
      console.log('  Ctrl+Shift+T - Test buttons')
      console.log('  Ctrl+Shift+E - Enable debug mode')
      console.log('================\n')
    }, 3000)
  })
  
  // 強化されたデバッグ用関数
  ;(window as any).testMenuButtons = () => {
    console.log('🧪 === TESTING MENU BUTTONS ===')
    if (gameManager) {
      const mainMenu = (gameManager as any).mainMenu
      if (mainMenu && mainMenu.testButtonClicks) {
        mainMenu.testButtonClicks()
      } else {
        console.error('❌ MainMenu or testButtonClicks method not available')
        console.log('Available mainMenu methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(mainMenu || {})))
      }
    } else {
      console.error('❌ GameManager not available')
    }
  }

  // TowerPurchaseUI デバッグ機能
  ;(window as any).debugTowerPurchaseUI = () => {
    console.log('🏗️ === TOWER PURCHASE UI DEBUG ===')
    const game = (window as any).game
    if (game && game.debugTowerPurchaseUI) {
      game.debugTowerPurchaseUI()
    } else {
      console.error('❌ Game instance or debug method not available')
    }
  }

  ;(window as any).testTowerPurchaseButtons = () => {
    console.log('🧪 === TESTING TOWER PURCHASE BUTTONS ===')
    const game = (window as any).game
    if (game && game.testTowerPurchaseButtons) {
      game.testTowerPurchaseButtons()
    } else {
      console.error('❌ Game instance or test method not available')
    }
  }

  ;(window as any).diagnoseClickability = () => {
    console.log('🔍 === DIAGNOSING UI CLICKABILITY ===')
    const game = (window as any).game
    if (game && game.diagnoseClickability) {
      game.diagnoseClickability()
    } else {
      console.error('❌ Game instance or diagnosis method not available')
    }
  }

  ;(window as any).debugTutorialButtons = () => {
    console.log('🎓 === DEBUG TUTORIAL BUTTONS ===')
    const game = (window as any).game
    if (game && game.debugTutorialButtons) {
      game.debugTutorialButtons()
    } else {
      console.error('❌ Game instance or tutorial debug method not available')
    }
  }

  ;(window as any).forceTestTutorial = () => {
    console.log('🎓 === FORCE TEST TUTORIAL ===')
    const game = (window as any).game
    if (game && game.forceTestTutorial) {
      game.forceTestTutorial()
    } else {
      console.error('❌ Game instance or tutorial test method not available')
    }
  }

  // 緊急チュートリアル修復コマンド
  ;(window as any).emergencyTutorialFix = () => {
    console.log('🚨 === EMERGENCY TUTORIAL FIX ===')
    
    // 既存のチュートリアル要素をすべて削除
    const existingOverlay = document.getElementById('tutorial-overlay')
    if (existingOverlay) {
      console.log('🗑️ Removing existing tutorial overlay')
      existingOverlay.remove()
    }
    
    // チュートリアルスタイルを削除
    const existingStyles = document.getElementById('tutorial-styles')
    if (existingStyles) {
      console.log('🗑️ Removing existing tutorial styles')
      existingStyles.remove()
    }
    
    // ゲームのチュートリアルシステムを再初期化
    const game = (window as any).game
    if (game) {
      console.log('🔄 Reinitializing tutorial system')
      try {
        // プライベートメンバーに直接アクセスして強制リセット
        ;(game as any).tutorialSystem = null
        
        // 新しいチュートリアルシステムを初期化
        ;(game as any).initializeTutorial()
        
        setTimeout(() => {
          console.log('🎓 Force starting tutorial after reset')
          game.startTutorial()
          
          setTimeout(() => {
            console.log('🔍 Post-emergency-fix verification')
            game.debugTutorialButtons()
          }, 2000)
        }, 1000)
        
      } catch (error) {
        console.error('❌ Emergency fix failed:', error)
      }
    }
  }

  ;(window as any).testTutorialUIBlocking = () => {
    console.log('🧪 === TEST TUTORIAL UI BLOCKING ===')
    const game = (window as any).game
    if (game && game.testTutorialUIBlocking) {
      game.testTutorialUIBlocking()
    } else {
      console.error('❌ Game instance or test method not available')
    }
  }
  
  ;(window as any).debugMenu = () => {
    console.log('🔍 === MENU DEBUG INFORMATION ===')
    console.log('  GameManager:', !!gameManager)
    console.log('  MainMenu:', !!(gameManager as any)?.mainMenu)
    
    const overlay = document.getElementById('main-menu-overlay')
    console.log('  Overlay element:', !!overlay)
    if (overlay) {
      const styles = window.getComputedStyle(overlay)
      console.log('  Overlay styles:', {
        display: styles.display,
        zIndex: styles.zIndex,
        opacity: styles.opacity,
        pointerEvents: styles.pointerEvents,
        position: styles.position,
        visibility: styles.visibility
      })
      
      const rect = overlay.getBoundingClientRect()
      console.log('  Overlay position:', rect)
    }
    
    // 詳細デバッグの実行
    if (gameManager && (gameManager as any).mainMenu) {
      const mainMenu = (gameManager as any).mainMenu
      if (mainMenu.performDetailedDebug) {
        mainMenu.performDetailedDebug()
      }
    }
  }
  
  ;(window as any).enableMenuDebug = () => {
    console.log('🔧 Enabling menu debug mode...')
    if (gameManager && (gameManager as any).mainMenu) {
      const mainMenu = (gameManager as any).mainMenu
      if (mainMenu.enableDebugMode) {
        mainMenu.enableDebugMode()
      }
    }
  }
  
  ;(window as any).forceMenuClick = () => {
    console.log('⚡ Force triggering menu callbacks...')
    if (gameManager && (gameManager as any).mainMenu) {
      const mainMenu = (gameManager as any).mainMenu
      console.log('Attempting to call onStartGame directly...')
      try {
        // プライベートメソッドに直接アクセス（デバッグ用）
        if (mainMenu.onStartGame) {
          mainMenu.onStartGame()
        }
      } catch (error) {
        console.error('Error calling onStartGame:', error)
      }
    }
  }
  
  ;(window as any).checkConflicts = () => {
    console.log('⚠️ === CHECKING FOR CONFLICTS ===')
    
    // すべてのイベントリスナーをチェック
    console.log('Document event listeners:', {
      click: !!document.onclick,
      mousedown: !!document.onmousedown,
      mouseup: !!document.onmouseup
    })
    
    // Gameクラスの状態をチェック
    const game = (window as any).game
    console.log('Game instance:', {
      exists: !!game,
      isRunning: game?.isRunning?.(),
      inputSystemActive: !!game?.getInputSystem
    })
    
    // PixiJSアプリケーションの状態
    console.log('PixiJS App:', {
      exists: !!app,
      interactive: app.stage?.interactive,
      interactiveChildren: app.stage?.interactiveChildren,
      eventMode: (app.stage as any)?.eventMode
    })
  }
}

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
  console.log('🧹 Cleaning up before page unload')
  if (gameManager) {
    try {
      gameManager.destroy()
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }
})