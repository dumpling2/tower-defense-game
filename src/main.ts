import { Application } from 'pixi.js'
import { Game } from '@/game/Game'
import '@/ui/debug-ui.css'

// PixiJSアプリケーションの初期化
const app = new Application({
  width: 1200,
  height: 800,
  backgroundColor: 0x1a1a2e,
  antialias: true
})

// HTMLにキャンバスを追加
const gameContainer = document.getElementById('game-container')
if (!gameContainer) {
  throw new Error('Game container not found')
}
gameContainer.appendChild(app.view as HTMLCanvasElement)

// ゲーム開始
const game = new Game(app)
game.start()

// 開発時のデバッグ情報
if (import.meta.env.DEV) {
  console.log('🎮 Tower Defense Game Started')
  console.log('📊 Canvas Size:', app.screen.width, 'x', app.screen.height)
  
  // グローバルアクセス用（デバッグ）
  ;(window as any).game = game
  ;(window as any).app = app
}