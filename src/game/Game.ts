import { Application, Container } from 'pixi.js'
import { GameState } from './GameState'
import { EconomySystem } from './EconomySystem'
import { EntityManager } from '@/systems/EntityManager'
import { RenderSystem } from '@/systems/RenderSystem'
import { PhysicsSystem } from '@/systems/PhysicsSystem'
import { InputSystem } from '@/systems/InputSystem'
import { GameSystem } from '@/systems/GameSystem'
import { Transform } from '@/entities/components/Transform'
import { Renderable } from '@/entities/components/Renderable'
import { Tower } from '@/entities/components/Tower'
import { DebugUIManager } from '@/ui/DebugUIManager'
import { TowerUpgradeUI, TowerUpgradeListener } from '@/ui/TowerUpgradeUI'
import { EconomyUI } from '@/ui/EconomyUI'
import { MapEditorUI } from '@/ui/MapEditorUI'
import { MapEditor } from '@/map/MapEditor'
import { MapDataUtils } from '@/map/MapData'
import { Entity } from '@/entities/Entity'
import { GameHUD } from '@/ui/GameHUD'
import { TowerPurchaseUI } from '@/ui/TowerPurchaseUI'
import { PlayerUI } from '@/ui/PlayerUI'
import { TutorialSystem } from '@/ui/TutorialSystem'
import { VictorySystem } from '@/systems/VictorySystem'
import { VictoryUI } from '@/ui/VictoryUI'

export class Game implements TowerUpgradeListener {
  private app: Application
  private gameState: GameState
  private economySystem: EconomySystem
  private entityManager: EntityManager
  private renderSystem: RenderSystem
  private physicsSystem: PhysicsSystem
  private inputSystem: InputSystem
  private gameSystem: GameSystem
  private debugUI: DebugUIManager
  private towerUpgradeUI: TowerUpgradeUI
  private economyUI: EconomyUI
  private mapEditor: MapEditor
  private mapEditorUI: MapEditorUI
  private particleContainer: Container
  
  // プレイヤー用UI
  private gameHUD: GameHUD | null = null
  private towerPurchaseUI: TowerPurchaseUI | null = null
  private playerUI: PlayerUI | null = null
  private tutorialSystem: TutorialSystem | null = null
  
  // 勝利システム
  private victorySystem: VictorySystem | null = null
  private victoryUI: VictoryUI | null = null
  
  private lastTime = 0
  private running = false
  private gameOverShown = false
  private victoryShown = false
  private gameSpeed = 1.0

  constructor(app: Application) {
    this.app = app
    this.gameState = new GameState()
    this.economySystem = new EconomySystem()
    this.entityManager = new EntityManager()
    
    // パーティクルコンテナを作成（エンティティの上に表示）
    this.particleContainer = new Container()
    this.app.stage.addChild(this.particleContainer)
    
    // システムの初期化（パフォーマンス最適化対応）
    this.renderSystem = new RenderSystem(app.stage, app)
    this.physicsSystem = new PhysicsSystem(() => this.onEnemyReachedGoal())
    this.inputSystem = new InputSystem(app.view as HTMLCanvasElement)
    
    // InputSystemをGameSystemに渡してタワー選択機能を有効化
    this.gameSystem = new GameSystem(this.entityManager, this.gameState, this.particleContainer, this.inputSystem)
    
    // UI系の初期化
    this.towerUpgradeUI = new TowerUpgradeUI(this.gameState)
    this.towerUpgradeUI.addListener(this)
    
    this.economyUI = new EconomyUI(this.economySystem)
    
    // マップエディターの初期化
    this.mapEditor = new MapEditor(this.app)
    this.mapEditorUI = new MapEditorUI(this.mapEditor)
    
    // タワー選択システムとアップグレードUIを連携
    const towerSelectionSystem = this.gameSystem.getTowerSelectionSystem()
    if (towerSelectionSystem) {
      towerSelectionSystem.addListener(this.towerUpgradeUI)
    }
    
    // デバッグUIの初期化
    this.debugUI = new DebugUIManager(this)
    
    // プレイヤー用UIの初期化
    this.initializePlayerUI()
    
    // 勝利システムの初期化
    this.initializeVictorySystem()
    
    this.setupGameLoop()
  }

  private initializePlayerUI(): void {
    // GameHUD（上部の基本情報）
    this.gameHUD = new GameHUD(
      this.gameState,
      this.gameSystem.getWaveSystem(),
      this.economySystem
    )
    
    // TowerPurchaseUI（左側のタワー購入）
    this.towerPurchaseUI = new TowerPurchaseUI(
      this.gameState,
      this.gameSystem
    )
    
    // PlayerUI（右側のゲーム制御）
    this.playerUI = new PlayerUI(
      this,
      this.gameSystem.getWaveSystem()
    )
  }

  /**
   * 勝利システムの初期化
   */
  private initializeVictorySystem(): void {
    // 勝利システムを初期化（WaveSystemは後で設定）
    this.victorySystem = new VictorySystem(this.gameState, this.gameSystem.getWaveSystem())
    
    // 勝利イベントコールバックを設定
    this.victorySystem.onVictoryAchieved = (stats) => {
      this.handleVictory(stats)
    }
    
    // 勝利UIを初期化
    this.victoryUI = new VictoryUI()
    this.victoryUI.setOnRestart(() => this.restartGame())
    this.victoryUI.setOnMainMenu(() => this.returnToMainMenu())
    this.victoryUI.setOnShowResults(() => this.showGameResults())
    
    console.log('🏆 Victory system initialized')
  }

  public start(): void {
    if (this.running) return
    
    console.log('🚀 Starting Game...')
    this.running = true
    this.gameState.setState('playing')
    
    // InputSystemを有効化してメニューとの競合を防ぐ
    this.inputSystem.setActive(true)
    console.log('🎮 InputSystem activated for game')
    
    // チュートリアルシステムを初期化
    this.initializeTutorial()
    
    // GameSystemにチュートリアル通知コールバックを設定
    this.gameSystem.setTutorialNotifyCallback((action, data) => {
      this.notifyTutorialAction(action, data)
    })
    
    // 初期エンティティの作成
    this.initializeGame()
    
    // 勝利システムにゲーム開始を通知
    if (this.victorySystem) {
      this.victorySystem.initializeGame()
      
      // GameHUDに勝利システムを設定
      if (this.gameHUD) {
        this.gameHUD.setVictorySystem(this.victorySystem)
      }
    }
    
    // ゲームループ開始
    this.app.ticker.add(this.gameLoop, this)
    
    console.log('✅ Game started successfully!')
  }

  public stop(): void {
    console.log('⏹️ Stopping Game...')
    this.running = false
    
    // InputSystemを無効化してメニューとの競合を防ぐ
    this.inputSystem.setActive(false)
    console.log('🎮 InputSystem deactivated for menu')
    
    // ゲームループ停止
    this.app.ticker.remove(this.gameLoop, this)
    
    console.log('✅ Game stopped successfully!')
  }

  public destroy(): void {
    console.log('🗑️ Destroying game...')
    
    // ゲームループ停止
    this.stop()
    
    // InputSystemの破棄（イベントリスナー削除）
    try {
      this.inputSystem.destroy()
      console.log('✅ InputSystem destroyed')
    } catch (error) {
      console.error('❌ Error destroying InputSystem:', error)
    }
    
    // UIのクリーンアップ
    try {
      if (this.debugUI) {
        this.debugUI.destroy()
      }
      if (this.gameHUD) {
        this.gameHUD.destroy()
        this.gameHUD = null
      }
      if (this.towerPurchaseUI) {
        this.towerPurchaseUI.destroy()
        this.towerPurchaseUI = null
      }
      if (this.playerUI) {
        this.playerUI.destroy()
        this.playerUI = null
      }
      if (this.victoryUI) {
        this.victoryUI.destroy()
        this.victoryUI = null
      }
      console.log('✅ UI systems destroyed')
    } catch (error) {
      console.error('❌ Error destroying UI systems:', error)
    }
    
    // レンダリングシステムの破棄
    try {
      if (this.renderSystem) {
        this.renderSystem.destroy()
      }
      console.log('✅ Render system destroyed')
    } catch (error) {
      console.error('❌ Error destroying render system:', error)
    }
    
    console.log('✅ Game destroyed successfully!')
  }

  private setupGameLoop(): void {
    this.app.ticker.maxFPS = 60
    this.app.ticker.minFPS = 30
  }

  private gameLoop(): void {
    if (!this.running) return

    const currentTime = Date.now()
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) // 最大0.1秒に制限
    this.lastTime = currentTime

    // ゲーム状態チェック
    const gameState = this.gameState.getState()
    if (gameState === 'gameOver') {
      this.handleGameOver()
      return
    } else if (gameState === 'victory') {
      this.handleVictoryState()
      return
    } else if (gameState !== 'playing') {
      // playing状態でない場合は更新をスキップ
      return
    }

    // ゲーム速度を適用したdeltaTime
    const adjustedDeltaTime = deltaTime * this.gameSpeed

    // システム更新（順序重要）
    this.inputSystem.update()
    this.economySystem.update(adjustedDeltaTime)
    this.gameSystem.update(adjustedDeltaTime)
    this.physicsSystem.update(adjustedDeltaTime, this.entityManager.getEntities())
    this.renderSystem.update(adjustedDeltaTime, this.entityManager.getEntities())
    
    // 勝利条件チェック
    if (this.victorySystem) {
      this.victorySystem.update()
    }
    
    // UI更新
    this.economyUI.updateDisplay()
    
    // エンティティのクリーンアップ
    this.entityManager.cleanup()
  }

  private initializeGame(): void {
    console.log('🎯 Initializing tower defense game...')
    
    // ゲーム状態を playing に設定
    this.gameState.setState('playing')
    
    // ゲーム速度を初期化
    this.gameSpeed = 1.0
    
    // サンプルパスの定義（左から右への直線）
    const samplePath = [
      { x: 50, y: 400 },
      { x: 200, y: 400 },
      { x: 400, y: 300 },
      { x: 600, y: 400 },
      { x: 800, y: 400 },
      { x: 1000, y: 400 },
      { x: 1150, y: 400 }
    ]

    // ウェーブシステムを初期化
    this.setupWaveSystem(samplePath)

    console.log('✅ Game initialized - ready for tower placement!')
    console.log('🏗️ Use the tower purchase panel on the left to build towers')
    console.log('🎯 Place towers strategically before starting the first wave')
    console.log('🎮 Use browser console commands:')
    console.log('  game.restartGame() - Restart the game completely')
    console.log('  game.forceCreateMissile() - Create single missile for debugging')
    console.log('  game.testMassiveMissileBarrage(100) - Test 100 missiles')
    console.log('  game.showPoolStats() - Show pool statistics')
    console.log('  game.togglePooling() - Toggle object pooling')
    console.log('  game.testGameSpeed() - Test speed change functionality')
    console.log('  game.setGameSpeed(2) - Set specific speed (0-3)')
    console.log('  game.forceVictory() - Force victory for testing')
    console.log('  game.showVictoryProgress() - Show victory conditions progress')
    console.log('⚡ Use speed buttons (1x/2x/3x) or keyboard (1-3 keys) to change speed')
  }

  private setupWaveSystem(path: { x: number; y: number }[]): void {
    // ウェーブシステムに敵パスを設定
    const waveSystem = this.gameSystem.getWaveSystem()
    waveSystem.setEnemyPath(path)
    
    console.log('🌊 Wave System initialized')
    console.log('  - 5 enemy types with different abilities')
    console.log('  - Progressive difficulty scaling')
    console.log('  - Boss waves every 5 waves')
    console.log('  - Automatic wave progression with preparation time')
  }

  // ゲーム状態アクセサ
  public getApp(): Application {
    return this.app
  }

  public getGameState(): GameState {
    return this.gameState
  }

  public getEntityManager(): EntityManager {
    return this.entityManager
  }

  public getGameSystem(): GameSystem {
    return this.gameSystem
  }

  public getEconomySystem(): EconomySystem {
    return this.economySystem
  }
  
  public getInputSystem(): InputSystem {
    return this.inputSystem
  }
  
  public isRunning(): boolean {
    return this.running
  }

  // ゲーム速度制御
  public setGameSpeed(speed: number): void {
    this.gameSpeed = Math.max(0, Math.min(3, speed)) // 0-3の範囲に制限
    console.log(`⚡ Game speed set to ${this.gameSpeed}x`)
  }

  public getGameSpeed(): number {
    return this.gameSpeed
  }

  // テスト用の速度変更コマンド
  public testGameSpeed(): void {
    console.log('🧪 Testing game speed functionality...')
    console.log(`Current speed: ${this.gameSpeed}x`)
    
    // 速度を順番にテスト
    const speeds = [0, 1, 2, 3]
    let currentIndex = 0
    
    const testNextSpeed = () => {
      if (currentIndex >= speeds.length) {
        console.log('✅ Speed test completed!')
        this.setGameSpeed(1) // デフォルトに戻す
        return
      }
      
      const speed = speeds[currentIndex]
      console.log(`Testing speed: ${speed}x`)
      this.setGameSpeed(speed)
      currentIndex++
      
      setTimeout(testNextSpeed, 2000) // 2秒間隔でテスト
    }
    
    testNextSpeed()
  }
  
  // 衝突判定統計表示
  public showCollisionStats(): void {
    const stats = this.gameSystem.getCollisionStats()
    const improvement = ((stats.checksSkipped / (stats.checksPerformed + stats.checksSkipped)) * 100).toFixed(1)
    
    console.log('⚡ Current Collision Statistics:')
    console.log(`  Checks performed: ${stats.checksPerformed}`)
    console.log(`  Checks skipped: ${stats.checksSkipped}`)
    console.log(`  Performance improvement: ${improvement}%`)
    console.log(`  Collisions detected: ${stats.collisionsDetected}`)
    
    if (stats.spatialHashStats) {
      console.log('🗺️ Spatial Hash Statistics:')
      console.log(`  Missile cells: ${stats.spatialHashStats.missile.cellCount}`)
      console.log(`  Enemy cells: ${stats.spatialHashStats.enemy.cellCount}`)
    }
  }

  // 大量ミサイルテスト機能
  public testMassiveMissileBarrage(count: number = 1000): void {
    console.log(`🚀 MASSIVE MISSILE BARRAGE TEST: ${count} missiles`)
    this.gameSystem.performMissileStressTest(count)
  }

  public testContinuousMissileStorm(missilesPerSecond: number = 100, duration: number = 30): void {
    console.log(`🌪️ CONTINUOUS MISSILE STORM: ${missilesPerSecond}/sec for ${duration}s`)
    this.gameSystem.performContinuousMissileTest(missilesPerSecond, duration)
  }

  // プール統計表示
  public showPoolStats(): void {
    console.log('📊 Current Pool Statistics:')
    this.gameSystem.getEntityFactory().logPoolStats()
  }

  // プール制御
  public togglePooling(): void {
    const current = this.gameSystem.isPoolingEnabled()
    this.gameSystem.setPoolingEnabled(!current)
    console.log(`🔧 Object pooling ${!current ? 'ENABLED' : 'DISABLED'}`)
  }

  // デバッグ用：強制ミサイル生成
  public forceCreateMissile(): void {
    const enemies = this.entityManager.getEntitiesByType('enemy')
    if (enemies.length === 0) {
      console.warn('No enemies available for missile test')
      return
    }

    const target = enemies[0]
    const missile = this.gameSystem.getEntityFactory().createMissile(600, 300, target, 25)
    console.log(`🚀 Force created missile ${missile.id} targeting ${target.id}`)
    
    // ミサイルの状態を詳細チェック
    const transform = missile.getComponent<Transform>('transform')
    const renderable = missile.getComponent<Renderable>('renderable')
    console.log(`  Position: (${transform?.x}, ${transform?.y})`)
    console.log(`  Active: ${missile.isEntityActive()}`)
    console.log(`  Container visible: ${missile.container.visible}`)
    if (renderable) {
      console.log(`  Renderable visible: ${renderable.displayObject.visible}`)
    }
  }
  
  // パーティクルエフェクトテスト
  public testParticleEffects(): void {
    console.log('🎆 Testing particle effects...')
    
    const particleSystem = this.gameSystem.getParticleSystem()
    
    // 大量爆発テスト
    particleSystem.testMassiveExplosions(10)
    
    // 個別エフェクトテスト
    setTimeout(() => {
      particleSystem.createExplosion({ x: 400, y: 300, particleCount: 50 })
    }, 1000)
    
    setTimeout(() => {
      particleSystem.createShockwave(600, 400, 80)
    }, 2000)
    
    setTimeout(() => {
      particleSystem.createHitSparks(800, 300)
    }, 3000)
    
    console.log('🎆 Particle effects sequence started! Watch the explosions!')
  }
  
  // エンティティ管理デバッグ
  public debugEntityManager(): void {
    const entities = this.entityManager.getEntities()
    const byType = new Map<string, number>()
    
    for (const entity of entities) {
      const count = byType.get(entity.type) || 0
      byType.set(entity.type, count + 1)
    }
    
    console.log('📋 EntityManager Debug Info:')
    console.log(`  Total entities: ${entities.length}`)
    for (const [type, count] of byType.entries()) {
      console.log(`  ${type}: ${count}`)
    }
    
    // ミサイルの詳細情報
    const missiles = entities.filter(e => e.type === 'missile')
    console.log(`🚀 Missile Details:`)
    missiles.forEach((missile, index) => {
      const renderable = missile.getComponent('renderable')
      const renderableVisible = renderable && (renderable as any).displayObject ? (renderable as any).displayObject.visible : 'N/A'
      
      console.log(`  ${index + 1}. ${missile.id}:`)
      console.log(`    - Active: ${missile.isEntityActive()}`)
      console.log(`    - Container visible: ${missile.container.visible}`)
      console.log(`    - Renderable visible: ${renderableVisible}`)
      console.log(`    - Container children: ${missile.container.children.length}`)
      
      if (missile.type === 'missile' && !missile.isEntityActive() && missile.container.visible) {
        console.log(`    ⚠️ WARNING: Inactive missile is still visible!`)
      }
    })
  }
  
  // ミサイル可視性強制修正
  public forceHideInactiveMissiles(): void {
    const entities = this.entityManager.getEntities()
    const missiles = entities.filter(e => e.type === 'missile')
    let hiddenCount = 0
    let shownCount = 0
    
    for (const missile of missiles) {
      const isActive = missile.isEntityActive()
      const isVisible = missile.container.visible
      
      if (!isActive && isVisible) {
        // 非アクティブなのに表示のミサイルを非表示
        missile.container.visible = false
        const renderable = missile.getComponent('renderable')
        if (renderable && (renderable as any).displayObject) {
          (renderable as any).displayObject.visible = false
        }
        hiddenCount++
      } else if (isActive && !isVisible) {
        // アクティブなのに非表示のミサイルを表示
        missile.container.visible = true
        const renderable = missile.getComponent('renderable')
        if (renderable && (renderable as any).displayObject) {
          (renderable as any).displayObject.visible = true
        }
        shownCount++
      }
    }
    
    console.log(`🔧 Fixed missiles: ${hiddenCount} hidden, ${shownCount} shown`)
    
    // 統計表示
    const totalMissiles = missiles.length
    const activeMissiles = missiles.filter(m => m.isEntityActive()).length
    const visibleMissiles = missiles.filter(m => m.container.visible).length
    
    console.log(`📊 Current status: ${activeMissiles}/${totalMissiles} active, ${visibleMissiles} visible`)
  }
  
  // 衝突判定ベンチマーク機能
  public benchmarkCollisionSystem(missileCount: number = 500): void {
    console.log(`⚡ COLLISION BENCHMARK: Testing with ${missileCount} missiles`)
    
    // 大量ミサイルを生成
    this.testMassiveMissileBarrage(missileCount)
    
    // ベンチマーク開始の通知
    console.log('🎯 Benchmark starting... Check debug panel for collision statistics')
    console.log('📊 Spatial partitioning should show significant performance improvement')
    
    // 10秒後に結果表示
    setTimeout(() => {
      const stats = this.gameSystem.getCollisionStats()
      const improvement = ((stats.checksSkipped / (stats.checksPerformed + stats.checksSkipped)) * 100).toFixed(1)
      
      console.log('🏁 BENCHMARK RESULTS:')
      console.log(`  💨 Collision checks performed: ${stats.checksPerformed}`)
      console.log(`  ⚡ Collision checks skipped: ${stats.checksSkipped}`)
      console.log(`  📈 Performance improvement: ${improvement}%`)
      console.log(`  🎯 Collisions detected: ${stats.collisionsDetected}`)
      
      if (parseFloat(improvement) > 80) {
        console.log('🌟 EXCELLENT: Spatial partitioning is working perfectly!')
      } else if (parseFloat(improvement) > 50) {
        console.log('👍 GOOD: Decent performance improvement')
      } else {
        console.log('⚠️ WARNING: Performance improvement is low')
      }
      
      // パーティクル統計も表示
      const particleStats = this.gameSystem.getParticleSystem().getStats()
      console.log('🎆 Particle System Stats:')
      console.log(`  Active particles: ${particleStats.activeParticles}`)
      console.log(`  Utilization: ${particleStats.utilization.toFixed(1)}%`)
    }, 10000)
  }
  
  // パフォーマンス最適化機能
  public enableBatchOptimization(): void {
    try {
      this.renderSystem.enableBatchOptimization()
      console.log('🚀 Batch optimization enabled')
      
      // 手動で最適化を実行
      const batchRenderer = this.renderSystem.getBatchRenderer()
      if (batchRenderer) {
        const entities = this.entityManager.getEntities()
        const readyEntities = entities.filter(e => {
          const renderable = e.getComponent('renderable')
          return renderable && (renderable as any).displayObject && e.container
        })
        
        if (readyEntities.length > 0) {
          batchRenderer.batchOptimizeEntities(readyEntities)
          console.log(`🚀 Manual optimization applied to ${readyEntities.length} entities`)
        }
      }
    } catch (error) {
      console.error('🚀 Failed to enable batch optimization:', error)
    }
  }

  public disableBatchOptimization(): void {
    this.renderSystem.disableBatchOptimization()
    console.log('⏸️ Batch optimization disabled')
  }

  public getPerformanceStats() {
    return this.renderSystem.getPerformanceStats()
  }

  public showPerformanceReport(): void {
    const monitor = this.renderSystem.getPerformanceMonitor()
    if (monitor) {
      monitor.logPerformanceReport()
    }
    
    const batchRenderer = this.renderSystem.getBatchRenderer()
    if (batchRenderer) {
      const stats = batchRenderer.getStats()
      console.log('🎨 Batch Rendering Stats:', stats)
    }
  }

  public benchmarkRendering(duration: number = 10): void {
    console.log(`🏁 Starting rendering benchmark for ${duration} seconds...`)
    
    const startTime = Date.now()
    let frameCount = 0
    
    const beforeStats = this.getPerformanceStats()
    
    const benchmarkInterval = setInterval(() => {
      frameCount++
      
      if ((Date.now() - startTime) / 1000 >= duration) {
        clearInterval(benchmarkInterval)
        
        const afterStats = this.getPerformanceStats()
        
        console.log('🏁 Rendering Benchmark Results:')
        console.log(`  Duration: ${duration}s`)
        console.log(`  Frames: ${frameCount}`)
        console.log(`  Average FPS: ${(frameCount / duration).toFixed(1)}`)
        
        if (beforeStats && afterStats) {
          console.log(`  FPS Before: ${beforeStats.fps.current}`)
          console.log(`  FPS After: ${afterStats.fps.current}`)
          console.log(`  Memory Before: ${beforeStats.memory?.used || 'N/A'}MB`)
          console.log(`  Memory After: ${afterStats.memory?.used || 'N/A'}MB`)
        }
        
        this.showPerformanceReport()
      }
    }, 16) // ~60fps
  }
  
  // ウェーブシステム機能
  public getCurrentWave(): number {
    return this.gameSystem.getCurrentWave()
  }

  public getWaveProgress() {
    return this.gameSystem.getWaveProgress()
  }

  public forceStartNextWave(): void {
    this.gameSystem.forceStartNextWave()
    console.log('🌊 Forced next wave to start')
  }

  public showWaveInfo(): void {
    const progress = this.getWaveProgress()
    const currentWave = this.getCurrentWave()
    
    console.log('🌊 Wave System Status:')
    console.log(`  Current Wave: ${currentWave}`)
    console.log(`  Status: ${progress.status}`)
    console.log(`  Enemies Spawned: ${progress.enemiesSpawned}`)
    console.log(`  Enemies Remaining: ${progress.enemiesRemaining}`)
    console.log(`  Enemies Killed: ${progress.enemiesKilled}`)
    console.log(`  Next Wave In: ${(progress.nextWaveIn / 1000).toFixed(1)}s`)
    
    if (currentWave > 0) {
      const waveSystem = this.gameSystem.getWaveSystem()
      const waveInfo = waveSystem.getWaveInfo(currentWave + 1)
      console.log(`\n🔮 Next Wave Preview (Wave ${currentWave + 1}):`)
      console.log(`  Total Enemies: ${waveInfo.totalEnemies}`)
      console.log(`  Enemy Types: ${waveInfo.enemyTypes.join(', ')}`)
      console.log(`  Boss Wave: ${waveInfo.bossWave ? 'Yes' : 'No'}`)
      console.log(`  Rewards: ${waveInfo.rewards.money} coins`)
    }
  }

  public testSpecificEnemyType(type: 'basic' | 'fast' | 'heavy' | 'armored' | 'boss'): void {
    const path = [
      { x: 50, y: 400 },
      { x: 200, y: 400 },
      { x: 400, y: 300 },
      { x: 600, y: 400 },
      { x: 800, y: 400 },
      { x: 1000, y: 400 },
      { x: 1150, y: 400 }
    ]
    
    this.gameSystem.createEnemy(path, undefined, type)
    console.log(`👹 Spawned ${type} enemy for testing`)
  }

  // TowerUpgradeListener インターフェースの実装
  public onUpgrade(tower: Entity): void {
    const success = this.gameSystem.upgradeTower(tower)
    if (success) {
      console.log('✅ Tower upgrade successful')
      // チュートリアルに通知
      this.notifyTutorialAction('tower-upgraded', { tower })
    } else {
      console.warn('❌ Tower upgrade failed')
    }
  }

  public onSell(tower: Entity): void {
    const sellValue = this.gameSystem.sellTower(tower)
    if (sellValue > 0) {
      console.log(`✅ Tower sold for ${sellValue} coins`)
    } else {
      console.warn('❌ Tower sell failed')
    }
  }

  // 経済システム機能
  public showEconomyStats(): void {
    const stats = this.economySystem.getEconomyStats()
    console.log('💰 Economy System Statistics:')
    console.log('  Currencies:')
    console.log(`    Gold: ${stats.currencies.gold.toLocaleString()}`)
    console.log(`    Crystal: ${stats.currencies.crystal.toLocaleString()}`)
    console.log(`    Research: ${stats.currencies.research.toLocaleString()}`)
    console.log(`    Energy: ${stats.currencies.energy.toLocaleString()}`)
    
    console.log('  Passive Income:')
    console.log(`    Gold: +${stats.passiveIncome.gold}/sec`)
    console.log(`    Crystal: +${stats.passiveIncome.crystal}/sec`)
    console.log(`    Research: +${stats.passiveIncome.research}/sec`)
    console.log(`    Energy: +${stats.passiveIncome.energy}/sec`)
    
    console.log('  Investment/Upgrades:')
    console.log(`    Active Investments: ${stats.activeInvestments}`)
    console.log(`    Purchased Upgrades: ${stats.purchasedUpgrades}/${stats.totalUpgrades}`)
    
    console.log('  Multipliers:')
    console.log(`    Damage: ${Math.round(stats.multipliers.damage * 100)}%`)
    console.log(`    Range: ${Math.round(stats.multipliers.range * 100)}%`)
    console.log(`    Fire Rate: ${Math.round(stats.multipliers.fireRate * 100)}%`)
    console.log(`    Income: ${Math.round(stats.multipliers.income * 100)}%`)
  }

  public debugAddCurrency(type: 'gold' | 'crystal' | 'research' | 'energy', amount: number): void {
    this.economySystem.debugAddCurrency({ [type]: amount })
    console.log(`💰 Added ${amount} ${type}`)
    this.economyUI.updateDisplay()
  }

  public testInvestment(investmentId: string): void {
    const success = this.economySystem.investIn(investmentId)
    if (success) {
      console.log(`✅ Investment successful: ${investmentId}`)
    } else {
      console.warn(`❌ Investment failed: ${investmentId} (insufficient funds or already completed)`)
    }
    this.economyUI.updateDisplay()
  }

  public testUpgrade(upgradeId: string): void {
    const success = this.economySystem.purchaseUpgrade(upgradeId)
    if (success) {
      console.log(`✅ Upgrade purchased: ${upgradeId}`)
    } else {
      console.warn(`❌ Upgrade failed: ${upgradeId} (insufficient funds or already purchased)`)
    }
    this.economyUI.updateDisplay()
  }

  public listAvailableInvestments(): void {
    const investments = this.economySystem.getAvailableInvestments()
    console.log('🏭 Available Investments:')
    investments.forEach(inv => {
      const costStr = Object.entries(inv.cost)
        .filter(([, amount]) => amount && amount > 0)
        .map(([type, amount]) => `${amount} ${type}`)
        .join(', ')
      
      console.log(`  ${inv.id}: ${inv.name} (${costStr})`)
      console.log(`    ${inv.description}`)
    })
  }

  public listAvailableUpgrades(): void {
    const upgrades = this.economySystem.getAvailableUpgrades()
    console.log('⬆️ Available Upgrades:')
    upgrades.forEach(upgrade => {
      const costStr = Object.entries(upgrade.cost)
        .filter(([, amount]) => amount && amount > 0)
        .map(([type, amount]) => `${amount} ${type}`)
        .join(', ')
      
      console.log(`  ${upgrade.id}: ${upgrade.name} (${costStr})`)
      console.log(`    ${upgrade.description}`)
    })
  }

  public showEconomyUI(): void {
    this.economyUI.show()
    console.log('💰 Economy UI opened (Ctrl+E to toggle)')
  }

  public hideEconomyUI(): void {
    this.economyUI.hide()
    console.log('💰 Economy UI closed')
  }

  // マップエディター機能
  public showMapEditor(): void {
    this.mapEditorUI.show()
    console.log('🗺️ Map Editor opened (Ctrl+M to toggle)')
  }

  public hideMapEditor(): void {
    this.mapEditorUI.hide()
    console.log('🗺️ Map Editor closed')
  }

  // TowerPurchaseUI デバッグ機能
  public debugTowerPurchaseUI(): void {
    console.log('🏗️ TowerPurchaseUI Debug:')
    if (this.towerPurchaseUI) {
      this.towerPurchaseUI.debugUIState()
    } else {
      console.error('❌ TowerPurchaseUI not initialized')
    }
  }

  // UI要素のクリック可能性を包括的に診断
  public diagnoseClickability(): void {
    console.log('🔍 === UI CLICKABILITY DIAGNOSIS ===')
    
    // キャンバス情報
    const canvas = this.app.view as HTMLCanvasElement
    console.log('📺 Canvas Settings:')
    console.log(`  - Z-index: ${canvas.style.zIndex}`)
    console.log(`  - Pointer events: ${canvas.style.pointerEvents}`)
    console.log(`  - Position: ${canvas.style.position}`)
    console.log(`  - Interactive: ${this.app.stage.interactive}`)
    console.log(`  - Event mode: ${(this.app.stage as any).eventMode}`)
    
    // 各UI要素のチェック
    const uiElements = [
      { name: 'Game HUD', selector: '.game-hud' },
      { name: 'Tower Purchase Panel', selector: '.tower-purchase-panel' },
      { name: 'Player Control Panel', selector: '.player-control-panel' },
      { name: 'Tower Purchase Buttons', selector: '.purchase-btn' },
      { name: 'Control Buttons', selector: '.control-btn' },
      { name: 'Debug Panel', selector: '.debug-panel' },
      // チュートリアル要素を追加
      { name: 'Tutorial Overlay', selector: '#tutorial-overlay' },
      { name: 'Tutorial Content', selector: '#tutorial-content' },
      { name: 'Tutorial Navigation', selector: '#tutorial-navigation' },
      { name: 'Tutorial Buttons', selector: '.tutorial-nav-btn' }
    ]
    
    console.log('🎛️ UI Elements Check:')
    uiElements.forEach(({ name, selector }) => {
      const elements = document.querySelectorAll(selector)
      console.log(`  ${name} (${selector}):`)
      console.log(`    - Found: ${elements.length} elements`)
      
      elements.forEach((element, index) => {
        const el = element as HTMLElement
        const styles = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        
        console.log(`    - Element ${index + 1}:`)
        console.log(`      * Z-index: ${styles.zIndex}`)
        console.log(`      * Pointer events: ${styles.pointerEvents}`)
        console.log(`      * Display: ${styles.display}`)
        console.log(`      * Visibility: ${styles.visibility}`)
        console.log(`      * Position: ${rect.top}x${rect.left} (${rect.width}x${rect.height})`)
        console.log(`      * Clickable: ${styles.pointerEvents !== 'none' && styles.display !== 'none'}`)
        
        // 要素がcanvasの上にあるかチェック
        const canvasRect = canvas.getBoundingClientRect()
        const overlapsCanvas = !(rect.right < canvasRect.left || 
                                rect.left > canvasRect.right || 
                                rect.bottom < canvasRect.top || 
                                rect.top > canvasRect.bottom)
        console.log(`      * Overlaps canvas: ${overlapsCanvas}`)
      })
    })
    
    // InputSystemの状態チェック
    console.log('🎮 InputSystem Status:')
    console.log(`  - Active: ${this.inputSystem ? 'Yes' : 'No'}`)
    if (this.inputSystem) {
      console.log(`  - Running: ${this.running}`)
      console.log(`  - Game state: ${this.gameState.getState()}`)
    }
    
    // イベントリスナーのチェック
    console.log('📡 Event Listeners Check:')
    const canvasElement = document.querySelector('canvas')
    console.log(`  - Canvas click listeners: ${canvasElement ? 'Yes' : 'No'}`)
    console.log(`  - Document click listeners: ${!!document.onclick}`)
    
    // メニューが非表示になっているかチェック
    const mainMenu = document.getElementById('main-menu-overlay')
    console.log('🏠 Main Menu Status:')
    console.log(`  - Exists: ${!!mainMenu}`)
    if (mainMenu) {
      const styles = window.getComputedStyle(mainMenu)
      console.log(`  - Display: ${styles.display}`)
      console.log(`  - Z-index: ${styles.zIndex}`)
      console.log(`  - Pointer events: ${styles.pointerEvents}`)
    }
    
    console.log('=====================================')
  }

  public testTowerPurchaseButtons(): void {
    console.log('🧪 Testing TowerPurchaseUI buttons:')
    if (this.towerPurchaseUI) {
      this.towerPurchaseUI.testButtonClicks()
    } else {
      console.error('❌ TowerPurchaseUI not initialized')
    }
  }

  // チュートリアルボタンのデバッグ機能
  public debugTutorialButtons(): void {
    console.log('🎓 === TUTORIAL BUTTONS DEBUG ===')
    
    // チュートリアルシステムの状態確認
    console.log('Tutorial System State:', {
      exists: !!this.tutorialSystem,
      active: this.tutorialSystem?.isActiveStatus(),
      completed: this.tutorialSystem?.isCompletedStatus(),
      currentStep: this.tutorialSystem?.getCurrentStepIndex(),
      totalSteps: this.tutorialSystem?.getTotalSteps()
    })
    
    // チュートリアルオーバーレイの状態
    const tutorialOverlay = document.getElementById('tutorial-overlay')
    console.log('Tutorial Overlay:', {
      exists: !!tutorialOverlay,
      visible: tutorialOverlay ? window.getComputedStyle(tutorialOverlay).display : 'N/A',
      opacity: tutorialOverlay ? window.getComputedStyle(tutorialOverlay).opacity : 'N/A',
      visibility: tutorialOverlay ? window.getComputedStyle(tutorialOverlay).visibility : 'N/A',
      zIndex: tutorialOverlay ? window.getComputedStyle(tutorialOverlay).zIndex : 'N/A',
      hasHiddenClass: tutorialOverlay?.classList.contains('hidden')
    })
    
    // チュートリアルコンテンツの状態
    const tutorialContent = document.getElementById('tutorial-content')
    console.log('Tutorial Content:', {
      exists: !!tutorialContent,
      visible: tutorialContent ? window.getComputedStyle(tutorialContent).display : 'N/A',
      zIndex: tutorialContent ? window.getComputedStyle(tutorialContent).zIndex : 'N/A'
    })
    
    // チュートリアルナビゲーションの状態
    const tutorialNav = document.getElementById('tutorial-navigation')
    console.log('Tutorial Navigation:', {
      exists: !!tutorialNav,
      visible: tutorialNav ? window.getComputedStyle(tutorialNav).display : 'N/A',
      children: tutorialNav?.children.length || 0,
      zIndex: tutorialNav ? window.getComputedStyle(tutorialNav).zIndex : 'N/A'
    })
    
    // チュートリアルボタンの状態
    const buttonIds = ['tutorial-prev', 'tutorial-next', 'tutorial-skip']
    buttonIds.forEach(id => {
      const button = document.getElementById(id) as HTMLButtonElement
      console.log(`Button ${id}:`, {
        exists: !!button,
        disabled: button?.disabled,
        className: button?.className,
        pointerEvents: button ? window.getComputedStyle(button).pointerEvents : 'N/A',
        zIndex: button ? window.getComputedStyle(button).zIndex : 'N/A',
        display: button ? window.getComputedStyle(button).display : 'N/A',
        visibility: button ? window.getComputedStyle(button).visibility : 'N/A',
        position: button ? `${button.getBoundingClientRect().left}, ${button.getBoundingClientRect().top}` : 'N/A',
        size: button ? `${button.getBoundingClientRect().width}x${button.getBoundingClientRect().height}` : 'N/A'
      })
      
      // ボタンのクリックテスト
      if (button) {
        console.log(`Testing click on ${id}...`)
        
        // プログラム的にクリックをテスト
        try {
          button.click()
          console.log(`  ✅ Programmatic click successful on ${id}`)
        } catch (error) {
          console.error(`  ❌ Programmatic click failed on ${id}:`, error)
        }
      }
    })
    
    // 全ての tutorial 関連要素をスキャン
    console.log('All Tutorial Elements Scan:')
    const allTutorialElements = document.querySelectorAll('[id*="tutorial"], [class*="tutorial"]')
    console.log(`Found ${allTutorialElements.length} tutorial-related elements:`)
    allTutorialElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect()
      const styles = window.getComputedStyle(element)
      console.log(`  ${index + 1}. ${element.tagName}#${element.id}.${element.className}`)
      console.log(`     - Position: ${rect.left}, ${rect.top} | Size: ${rect.width}x${rect.height}`)
      console.log(`     - Display: ${styles.display} | Visibility: ${styles.visibility}`)
      console.log(`     - Z-index: ${styles.zIndex} | Pointer-events: ${styles.pointerEvents}`)
    })
    
    // チュートリアルシステム内部状態の詳細調査
    if (this.tutorialSystem) {
      console.log('🔍 Tutorial System Internal Investigation:')
      try {
        const tutorialUI = (this.tutorialSystem as any).tutorialUI
        console.log('  TutorialUI exists:', !!tutorialUI)
        if (tutorialUI) {
          console.log('  TutorialUI visibility:', tutorialUI.getVisibility?.())
          console.log('  TutorialUI overlay:', !!tutorialUI.overlay)
          console.log('  TutorialUI navigation panel:', !!tutorialUI.navigationPanel)
        }
      } catch (error) {
        console.warn('  Error accessing tutorial internals:', error)
      }
    }
    
    // 強制的にチュートリアル要素を再作成する試み
    console.log('🔧 Attempting to force tutorial recreation...')
    if (this.tutorialSystem && this.tutorialSystem.isActiveStatus()) {
      console.log('  Tutorial is active, attempting to refresh display')
      try {
        // チュートリアルを一度停止して再開
        const currentStep = this.tutorialSystem.getCurrentStepIndex()
        console.log(`  Current step: ${currentStep}`)
        
        // TutorialUIに直接アクセスして再表示を試行
        const tutorialUI = (this.tutorialSystem as any).tutorialUI
        if (tutorialUI && typeof tutorialUI.show === 'function') {
          tutorialUI.show()
          console.log('  ✅ TutorialUI.show() called')
        }
      } catch (error) {
        console.error('  ❌ Error during tutorial refresh:', error)
      }
    }
    
    console.log('================================')
  }

  // チュートリアル中のUI無効化を手動でテスト
  public testTutorialUIBlocking(): void {
    console.log('🧪 === TESTING TUTORIAL UI BLOCKING ===')
    
    if (!this.tutorialSystem) {
      console.log('❌ Tutorial system not initialized')
      return
    }
    
    const tutorialUI = (this.tutorialSystem as any).tutorialUI
    if (!tutorialUI) {
      console.log('❌ TutorialUI not found')
      return
    }
    
    console.log('🎓 Testing UI blocking functionality...')
    
    // チュートリアルを開始
    this.startTutorial()
    
    setTimeout(() => {
      // 設定ボタンの状態を確認
      const settingsButtons = document.querySelectorAll('.action-btn, .back-btn, #settings-back-btn')
      console.log(`🔍 Found ${settingsButtons.length} settings-related buttons`)
      
      settingsButtons.forEach((button, index) => {
        const btn = button as HTMLButtonElement
        const isDisabled = btn.disabled || btn.getAttribute('data-tutorial-disabled') === 'true'
        const pointerEvents = window.getComputedStyle(btn).pointerEvents
        console.log(`  Button ${index + 1}: disabled=${isDisabled}, pointer-events=${pointerEvents}`)
      })
      
      // 他のUI要素の状態を確認
      const uiElements = document.querySelectorAll('.game-hud, .tower-purchase-panel, .player-control-panel')
      console.log(`🔍 Found ${uiElements.length} main UI elements`)
      
      uiElements.forEach((element, index) => {
        const el = element as HTMLElement
        const isBlocked = el.getAttribute('data-tutorial-disabled') === 'true'
        const pointerEvents = window.getComputedStyle(el).pointerEvents
        const filter = window.getComputedStyle(el).filter
        console.log(`  UI Element ${index + 1}: blocked=${isBlocked}, pointer-events=${pointerEvents}, filter=${filter}`)
      })
      
    }, 2000)
  }

  // チュートリアルの強制テスト開始
  public forceTestTutorial(): void {
    console.log('🎓 Force starting tutorial for testing...')
    
    // チュートリアルシステムが存在しない場合は初期化
    if (!this.tutorialSystem) {
      console.log('🎓 Tutorial system not initialized, initializing now...')
      this.initializeTutorial()
    }
    
    // チュートリアルを開始
    this.startTutorial()
    
    // 段階的な検証とデバッグ
    setTimeout(() => {
      console.log('🎓 First verification (1 second after start):')
      const overlay = document.getElementById('tutorial-overlay')
      console.log(`  Overlay exists: ${!!overlay}`)
      console.log(`  Overlay visible: ${overlay ? !overlay.classList.contains('hidden') : false}`)
    }, 1000)
    
    setTimeout(() => {
      console.log('🎓 Second verification (2 seconds after start):')
      this.debugTutorialButtons()
    }, 2000)
    
    setTimeout(() => {
      console.log('🎓 Final verification (3 seconds after start):')
      const buttons = ['tutorial-prev', 'tutorial-next', 'tutorial-skip']
      buttons.forEach(id => {
        const btn = document.getElementById(id)
        if (btn) {
          console.log(`  Button ${id} ready for interaction`)
          // ボタンにマウスオーバーイベントを強制発生
          const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true })
          btn.dispatchEvent(mouseOverEvent)
        } else {
          console.warn(`  Button ${id} not found`)
        }
      })
    }, 3000)
  }

  public getMapEditor(): MapEditor {
    return this.mapEditor
  }

  public loadMapFromEditor(): void {
    const mapData = this.mapEditor.getMapData()
    const validation = MapDataUtils.validateMapData(mapData)
    
    if (!validation.valid) {
      console.warn('❌ Cannot load map: validation failed')
      validation.issues.forEach(issue => console.warn(`  - ${issue}`))
      return
    }

    // マップデータをゲームに適用
    try {
      // パスをゲームシステムに設定
      const waveSystem = this.gameSystem.getWaveSystem()
      waveSystem.setEnemyPath(mapData.pathPoints)
      
      // 経済設定を適用
      this.gameState.reset()
      this.economySystem.reset()
      this.economySystem.debugAddCurrency({ gold: mapData.economySettings.startingMoney })
      
      // 既存のタワーをクリア
      const towers = this.entityManager.getEntitiesByType('tower')
      towers.forEach(tower => this.entityManager.removeEntity(tower.id))
      
      console.log('✅ Map loaded successfully from editor')
      console.log(`  Name: ${mapData.config.name}`)
      console.log(`  Size: ${mapData.config.width}x${mapData.config.height}`)
      console.log(`  Path points: ${mapData.pathPoints.length}`)
      console.log(`  Tower zones: ${mapData.towerZones.length}`)
      console.log(`  Starting money: ${mapData.economySettings.startingMoney}`)
    } catch (error) {
      console.error('❌ Failed to load map:', error)
    }
  }

  public exportCurrentMapState(): void {
    try {
      // 現在のゲーム状態をマップデータとして出力
      const waveSystem = this.gameSystem.getWaveSystem()
      const enemyPath = waveSystem.getEnemyPath()
      const mapData = MapDataUtils.createEmptyMap(20, 15, 32)
      
      mapData.config.name = 'Current Game State'
      mapData.config.description = 'Exported from current game session'
      // パスポイントを変換
      mapData.pathPoints = enemyPath.map((point) => ({
        x: point.x,
        y: point.y,
        cellX: Math.floor(point.x / 32),
        cellY: Math.floor(point.y / 32)
      }))
      mapData.economySettings.startingMoney = this.gameState.getMoney()
      
      const json = MapDataUtils.toJSON(mapData)
      console.log('📁 Current game state exported:')
      console.log(json)
      
      // ダウンロード
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'current_game_state.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('❌ Export failed:', error)
    }
  }

  public listDefaultMaps(): void {
    const maps = MapDataUtils.getDefaultMaps()
    console.log('📦 Available Default Maps:')
    maps.forEach((map, index) => {
      const preview = MapDataUtils.generatePreview(map)
      console.log(`  ${index}: ${preview.name}`)
      console.log(`    Size: ${preview.size}`)
      console.log(`    Difficulty: ${preview.difficulty}`)
      console.log(`    Description: ${preview.description}`)
      console.log(`    Valid: ${preview.valid}`)
    })
  }

  public loadDefaultMap(index: number): void {
    try {
      const maps = MapDataUtils.getDefaultMaps()
      if (index >= 0 && index < maps.length) {
        this.mapEditor.setMapData(maps[index])
        console.log(`📦 Loaded default map ${index}: ${maps[index].config.name}`)
        
        // 自動的にゲームにも適用
        this.loadMapFromEditor()
      } else {
        console.warn(`❌ Invalid map index: ${index} (available: 0-${maps.length - 1})`)
      }
    } catch (error) {
      console.error('❌ Failed to load default map:', error)
    }
  }

  public testMapEditor(): void {
    console.log('🧪 Testing Map Editor functionality...')
    
    // エディターの状態をテスト
    const editorState = this.mapEditor.getEditorState()
    console.log('  Current tool:', editorState.currentTool)
    console.log('  Grid visible:', editorState.gridVisible)
    console.log('  Preview mode:', editorState.previewMode)
    
    // マップデータをテスト
    const mapData = this.mapEditor.getMapData()
    const validation = MapDataUtils.validateMapData(mapData)
    console.log('  Map validation:', validation.valid)
    
    if (!validation.valid) {
      console.log('  Issues:')
      validation.issues.forEach(issue => console.log(`    - ${issue}`))
    }
    
    // プレビュー情報
    const preview = MapDataUtils.generatePreview(mapData)
    console.log('  Map preview:', preview)
  }

  // ゲームオーバー処理
  private handleGameOver(): void {
    if (this.gameOverShown) {
      return // 既に表示済みの場合は何もしない
    }
    
    console.log('💀 GAME OVER - Processing end game...')
    this.gameOverShown = true
    
    // ゲームオーバー画面を表示
    this.showGameOverMessage()
    
    // ゲームを停止はしない（観察可能にするため）
    // this.stop()
  }

  // 勝利状態処理
  private handleVictoryState(): void {
    if (this.victoryShown) {
      return // 既に表示済みの場合は何もしない
    }
    
    console.log('🏆 VICTORY STATE - Processing victory...')
    this.victoryShown = true
    
    // 勝利統計を生成して勝利画面を表示
    if (this.victorySystem && this.victoryUI) {
      const stats = this.victorySystem.generateVictoryStats()
      const conditions = this.victorySystem.getConditionProgress()
      this.victoryUI.show(stats, conditions.map(c => ({
        description: c.condition.description,
        completed: c.completed
      })))
    }
    
    // ゲームを停止はしない（観察可能にするため）
    // this.stop()
  }

  // 勝利トリガー処理（VictorySystemから呼び出される）
  private handleVictory(stats: any): void {
    console.log('🎉 VICTORY ACHIEVED!', stats)
    
    // 勝利統計を表示
    console.log('📊 Victory Statistics:')
    console.log(`  🕐 Clear Time: ${Math.round(stats.clearTime / 1000)}s`)
    console.log(`  ❤️ Lives Remaining: ${stats.livesRemaining}/20`)
    console.log(`  🎯 Accuracy: ${Math.round(stats.accuracy * 100)}%`)
    console.log(`  🌊 Waves Completed: ${stats.wavesCompleted}`)
    console.log(`  👹 Enemies Killed: ${stats.enemiesKilled}`)
    console.log(`  💰 Money Remaining: ${stats.moneyRemaining}`)
    console.log(`  🏆 Perfect Clear: ${stats.perfectClear ? 'Yes' : 'No'}`)
    
    // ゲーム状態は既にVictorySystemで'victory'に設定済み
  }

  // メインメニューに戻る処理
  private returnToMainMenu(): void {
    console.log('🏠 Returning to main menu...')
    
    // 勝利画面を閉じる
    if (this.victoryUI) {
      this.victoryUI.hide()
    }
    
    // ゲームオーバー画面を閉じる
    const overlay = document.getElementById('game-over-overlay')
    overlay?.remove()
    
    // ゲームを停止
    this.stop()
    
    // ゲーム状態をメニューに変更
    this.gameState.setState('menu')
    
    console.log('✅ Returned to main menu')
    
    // 注意: 実際のメインメニュー表示はGameManagerが担当
    // ここでは状態変更のみ行い、GameManagerに委ねる
  }

  // 勝利システムのデバッグ機能
  public forceVictory(): void {
    console.log('🏆 Forcing victory for testing...')
    if (this.victorySystem) {
      this.gameState.setState('victory')
      const stats = this.victorySystem.generateVictoryStats()
      this.handleVictory(stats)
    } else {
      console.warn('❌ Victory system not initialized')
    }
  }

  public showVictoryProgress(): void {
    if (!this.victorySystem) {
      console.warn('❌ Victory system not initialized')
      return
    }
    
    console.log('🏆 Victory Progress:')
    const conditions = this.victorySystem.getConditionProgress()
    conditions.forEach(condition => {
      const progress = Math.round(condition.progress * 100)
      const status = condition.completed ? '✅' : '⏳'
      console.log(`  ${status} ${condition.condition.description}: ${progress}%`)
    })
    
    const mainCondition = this.victorySystem.getMainCondition()
    if (mainCondition) {
      const currentWave = this.gameSystem.getWaveSystem().getCurrentWave()
      const targetWave = mainCondition.targetValue
      console.log(`📊 Main Goal: Wave ${currentWave}/${targetWave}`)
    }
  }

  private showGameOverMessage(): void {
    // 画面中央にゲームオーバーメッセージを表示
    const gameOverHTML = `
      <div id="game-over-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: linear-gradient(135deg, #2d1b69, #11001c);
          border: 2px solid #ff4757;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          animation: gameOverPulse 1s ease-in-out infinite alternate;
        ">
          <h1 style="
            color: #ff4757;
            font-size: 48px;
            margin: 0 0 20px 0;
            text-shadow: 0 0 20px rgba(255, 71, 87, 0.5);
          ">💀 GAME OVER</h1>
          <p style="
            color: #ffffff;
            font-size: 18px;
            margin: 0 0 30px 0;
          ">全てのライフを失いました</p>
          <div style="
            display: flex;
            gap: 20px;
            justify-content: center;
          ">
            <button id="restart-btn" style="
              background: linear-gradient(135deg, #2ecc71, #27ae60);
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
            ">🔄 再スタート</button>
            <button id="close-game-over-btn" style="
              background: linear-gradient(135deg, #3498db, #2980b9);
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
            ">📊 結果を見る</button>
          </div>
        </div>
      </div>
      <style>
        @keyframes gameOverPulse {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
      </style>
    `
    
    const existingOverlay = document.getElementById('game-over-overlay')
    if (existingOverlay) {
      existingOverlay.remove()
    }
    
    const overlayContainer = document.createElement('div')
    overlayContainer.innerHTML = gameOverHTML
    document.body.appendChild(overlayContainer)
    
    // イベントリスナーを追加
    const restartBtn = document.getElementById('restart-btn')
    const closeBtn = document.getElementById('close-game-over-btn')
    
    restartBtn?.addEventListener('click', () => {
      this.restartGame()
    })
    
    closeBtn?.addEventListener('click', () => {
      this.showGameResults()
    })
  }

  private showGameResults(): void {
    // ゲームオーバー画面を閉じる
    const overlay = document.getElementById('game-over-overlay')
    overlay?.remove()
    
    // 統計情報を収集
    const gameStats = {
      waveReached: this.gameState.getWave(),
      enemiesKilled: this.gameState.getEnemiesKilled(),
      missileFired: this.gameState.getMissileFired(),
      score: this.gameState.getScore(),
      finalMoney: this.gameState.getMoney(),
      accuracy: this.gameState.getMissileFired() > 0 
        ? ((this.gameState.getEnemiesKilled() / this.gameState.getMissileFired()) * 100).toFixed(1)
        : '0.0'
    }
    
    // タワー統計を収集
    const towers = this.entityManager.getEntitiesByType('tower')
    const towerStats = towers.map(tower => {
      const towerComponent = tower.getComponent('tower') as Tower
      if (towerComponent) {
        return {
          type: tower.type || 'tower',
          level: towerComponent.getLevel(),
          kills: towerComponent.getTotalKills(),
          damage: towerComponent.getTotalDamageDealt(),
          shots: towerComponent.getTotalShotsFired(),
          efficiency: towerComponent.getEfficiency().toFixed(1)
        }
      }
      return null
    }).filter(Boolean)
    
    const resultsHTML = `
      <div id="game-results-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow-y: auto;
      ">
        <div style="
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 2px solid #0066cc;
          border-radius: 16px;
          padding: 30px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        ">
          <h1 style="
            color: #00aaff;
            font-size: 32px;
            margin: 0 0 20px 0;
            text-align: center;
            text-shadow: 0 0 20px rgba(0, 170, 255, 0.5);
          ">📊 ゲーム結果</h1>
          
          <div style="color: white; margin-bottom: 20px;">
            <h3 style="color: #ffd700; margin-bottom: 10px;">🎯 基本統計</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
              <div>🌊 到達ウェーブ: <strong>${gameStats.waveReached}</strong></div>
              <div>💰 最終資金: <strong>${gameStats.finalMoney}</strong></div>
              <div>💀 撃破数: <strong>${gameStats.enemiesKilled}</strong></div>
              <div>🚀 発射数: <strong>${gameStats.missileFired}</strong></div>
              <div>🎯 命中率: <strong>${gameStats.accuracy}%</strong></div>
              <div>⭐ スコア: <strong>${gameStats.score}</strong></div>
            </div>
          </div>
          
          <div style="color: white; margin-bottom: 20px;">
            <h3 style="color: #ffd700; margin-bottom: 10px;">🏗️ タワー統計</h3>
            <div style="max-height: 200px; overflow-y: auto;">
              ${towerStats.length > 0 ? towerStats.map((tower, index) => {
                if (!tower) return ''
                return `
                <div style="
                  background: rgba(255, 255, 255, 0.1);
                  padding: 10px;
                  margin-bottom: 8px;
                  border-radius: 8px;
                  border-left: 4px solid #00aaff;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${tower.type} タワー #${index + 1}</strong>
                    <span style="color: #00ff88;">Lv.${tower.level}</span>
                  </div>
                  <div style="font-size: 14px; margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    <span>撃破: ${tower.kills}</span>
                    <span>ダメージ: ${Math.floor(tower.damage)}</span>
                    <span>発射: ${tower.shots}</span>
                    <span>効率: ${tower.efficiency}%</span>
                  </div>
                </div>
                `
              }).join('') : '<p style="text-align: center; color: #999;">タワーが配置されていませんでした</p>'}
            </div>
          </div>
          
          <div style="
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-top: 20px;
          ">
            <button id="restart-from-results-btn" style="
              background: linear-gradient(135deg, #2ecc71, #27ae60);
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
            ">🔄 再スタート</button>
            <button id="close-results-btn" style="
              background: linear-gradient(135deg, #e74c3c, #c0392b);
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
            ">✕ 閉じる</button>
          </div>
        </div>
      </div>
    `
    
    const resultsContainer = document.createElement('div')
    resultsContainer.innerHTML = resultsHTML
    document.body.appendChild(resultsContainer)
    
    // イベントリスナーを追加
    const restartBtn = document.getElementById('restart-from-results-btn')
    const closeBtn = document.getElementById('close-results-btn')
    
    restartBtn?.addEventListener('click', () => {
      const resultsOverlay = document.getElementById('game-results-overlay')
      resultsOverlay?.remove()
      this.restartGame()
    })
    
    closeBtn?.addEventListener('click', () => {
      const resultsOverlay = document.getElementById('game-results-overlay')
      resultsOverlay?.remove()
    })
  }

  public restartGame(): void {
    console.log('🔄 Restarting game...')
    
    // ゲームオーバー画面を閉じる
    const overlay = document.getElementById('game-over-overlay')
    overlay?.remove()
    
    // 結果画面も閉じる
    const resultsOverlay = document.getElementById('game-results-overlay')
    resultsOverlay?.remove()
    
    // ゲームオーバーフラグをリセット
    this.gameOverShown = false
    this.victoryShown = false
    
    // 勝利画面を閉じる
    if (this.victoryUI) {
      this.victoryUI.hide()
    }
    
    // すべてのシステムをリセット
    console.log('  Step 1/8: Resetting game state...')
    
    // 1. ゲーム状態をリセット
    this.gameState.reset()
    
    console.log('  Step 2/8: Resetting economy system...')
    // 2. 経済システムをリセット
    if (this.economySystem && typeof this.economySystem.reset === 'function') {
      this.economySystem.reset()
    }
    
    console.log('  Step 3/8: Clearing all entities...')
    // 3. エンティティをクリア
    this.entityManager.clear()
    
    console.log('  Step 4/8: Resetting wave system...')
    // 4. ウェーブシステムをリセット
    const waveSystem = this.gameSystem.getWaveSystem()
    if (waveSystem && typeof waveSystem.reset === 'function') {
      waveSystem.reset()
    }
    
    console.log('  Step 5/8: Clearing particle system...')
    // 5. パーティクルシステムをクリア
    const particleSystem = this.gameSystem.getParticleSystem()
    if (particleSystem && typeof particleSystem.clear === 'function') {
      particleSystem.clear()
    }
    
    console.log('  Step 6/8: Clearing tower selection...')
    // 6. タワー選択をクリア
    try {
      if (this.gameSystem && typeof (this.gameSystem as any).clearSelectedTower === 'function') {
        (this.gameSystem as any).clearSelectedTower()
      }
    } catch (error) {
      console.log('    Tower selection clear skipped (method not available)')
    }
    
    console.log('  Step 7/8: Resetting UI elements...')
    // 7. UI要素をリセット
    try {
      // タワーアップグレードUIを非表示
      if (this.towerUpgradeUI && typeof (this.towerUpgradeUI as any).hideTowerInfo === 'function') {
        (this.towerUpgradeUI as any).hideTowerInfo()
      }
    } catch (error) {
      console.log('    Tower upgrade UI reset skipped')
    }
    
    console.log('  Step 8/9: Updating economy display...')
    // 8. エコノミーUIを更新
    if (this.economyUI && typeof this.economyUI.updateDisplay === 'function') {
      this.economyUI.updateDisplay()
    }
    
    console.log('  Step 9/9: Resetting victory system...')
    // 9. 勝利システムをリセット
    if (this.victorySystem && typeof this.victorySystem.reset === 'function') {
      this.victorySystem.reset()
    }
    
    console.log('  All systems reset complete')
    
    // ゲーム状態を再設定
    this.gameState.setState('playing')
    
    // ゲームを再初期化
    this.initializeGame()
    
    console.log('✅ Game restarted successfully!')
  }

  // 敵がゴールに到達した際の処理
  private onEnemyReachedGoal(): void {
    // ライフを1減らす
    this.gameState.loseLife()
    
    // 敵タイプに応じたライフダメージを実装したい場合は、ここで設定
    // const enemyType = enemy.getComponent('enemyType')
    // if (enemyType?.type === 'boss') {
    //   this.gameState.loseLife() // ボスはライフ2減らす等
    // }
    
    const remainingLives = this.gameState.getLives()
    console.log(`💀 Enemy reached goal! Lives remaining: ${remainingLives}`)
    
    // ライフが0になった場合の追加処理
    if (remainingLives === 0) {
      console.log('💀 GAME OVER - All lives lost!')
      // ゲームオーバー処理は自動的にゲームループで処理される
    } else if (remainingLives <= 5) {
      console.warn('⚠️ WARNING: Low lives remaining!')
    }
  }

  // チュートリアルシステム関連メソッド
  private initializeTutorial(): void {
    if (!this.tutorialSystem) {
      this.tutorialSystem = new TutorialSystem(this.gameState)
      // Game参照を設定
      this.tutorialSystem.setGame(this)
      
      // チュートリアル完了・スキップ時のコールバック設定
      this.tutorialSystem.setOnComplete(() => {
        console.log('🎓 Tutorial completed successfully!')
        this.onTutorialComplete()
      })
      
      this.tutorialSystem.setOnSkip(() => {
        console.log('⏭️ Tutorial skipped by user')
        this.onTutorialComplete()
      })
      
      // チュートリアルUIイベントハンドラー設定
      const tutorialUI = (this.tutorialSystem as any).tutorialUI
      if (tutorialUI) {
        console.log('🎓 Setting tutorial UI event handlers...')
        tutorialUI.setEventHandlers({
          onNext: () => {
            console.log('🎓 onNext handler called')
            this.tutorialSystem?.nextStep()
          },
          onPrevious: () => {
            console.log('🎓 onPrevious handler called') 
            this.tutorialSystem?.previousStep()
          },
          onSkip: () => {
            console.log('🎓 onSkip handler called')
            this.tutorialSystem?.skipTutorial()
          },
          onClose: () => {
            console.log('🎓 onClose handler called')
            this.tutorialSystem?.skipTutorial()
          }
        })
        console.log('🎓 Tutorial UI event handlers set successfully')
      } else {
        console.error('❌ TutorialUI not found in TutorialSystem')
      }
      
      console.log('🎓 Tutorial system initialized')
    }
    
    // 初回プレイヤーかチェック
    if (this.tutorialSystem.isFirstTimePlayer()) {
      console.log('👋 First-time player detected, starting tutorial...')
      // より長い遅延でUI初期化完了を確実に待つ
      setTimeout(() => {
        console.log('🎓 Starting tutorial after delay...')
        if (this.tutorialSystem) {
          this.tutorialSystem.startTutorial()
          
          // さらに追加の検証
          setTimeout(() => {
            console.log('🔍 Post-tutorial-start verification:')
            const overlay = document.getElementById('tutorial-overlay')
            const hasHidden = overlay?.classList.contains('hidden')
            console.log(`  Overlay exists: ${!!overlay}`)
            console.log(`  Has hidden class: ${hasHidden}`)
            
            if (overlay && hasHidden) {
              console.warn('⚠️ Tutorial overlay still has hidden class, forcing display')
              overlay.classList.remove('hidden')
            }
          }, 500)
        }
      }, 3000) // 3秒に延長してより確実にUI準備完了を待つ
    }
  }

  private onTutorialComplete(): void {
    console.log('🎉 Tutorial system completed, game ready for play')
    // チュートリアル完了後の処理（必要に応じて）
  }

  public startTutorial(): void {
    if (!this.tutorialSystem) {
      this.initializeTutorial()
    }
    this.tutorialSystem?.startTutorial()
  }

  public skipTutorial(): void {
    this.tutorialSystem?.skipTutorial()
  }

  public resetTutorialProgress(): void {
    this.tutorialSystem?.resetProgress()
    console.log('🔄 Tutorial progress reset')
  }

  // チュートリアルアクション通知メソッド
  public notifyTutorialAction(action: string, data?: any): void {
    this.tutorialSystem?.notifyActionCompleted(action, data)
  }

  // デバッグ用チュートリアルコマンド
  public testTutorialSystem(): void {
    console.log('🧪 Testing Tutorial System...')
    
    if (!this.tutorialSystem) {
      console.log('  Initializing tutorial system...')
      this.initializeTutorial()
    }
    
    console.log('  Tutorial System Status:')
    console.log(`    Active: ${this.tutorialSystem?.isActiveStatus()}`)
    console.log(`    Completed: ${this.tutorialSystem?.isCompletedStatus()}`)
    console.log(`    Current Step: ${this.tutorialSystem?.getCurrentStepIndex()} / ${this.tutorialSystem?.getTotalSteps()}`)
    console.log(`    First Time Player: ${this.tutorialSystem?.isFirstTimePlayer()}`)
    
    const currentStep = this.tutorialSystem?.getCurrentStep()
    if (currentStep) {
      console.log(`    Current Step Title: "${currentStep.title}"`)
      console.log(`    Current Step Action: "${currentStep.action}"`)
    }
  }

  public forceTutorialStep(stepIndex: number): void {
    if (this.tutorialSystem) {
      this.tutorialSystem.goToStep(stepIndex)
      console.log(`🎯 Forced tutorial to step ${stepIndex}`)
    } else {
      console.warn('❌ Tutorial system not initialized')
    }
  }

  public getTutorialStatus(): any {
    if (!this.tutorialSystem) {
      return { error: 'Tutorial system not initialized' }
    }
    
    return {
      active: this.tutorialSystem.isActiveStatus(),
      completed: this.tutorialSystem.isCompletedStatus(),
      currentStep: this.tutorialSystem.getCurrentStepIndex(),
      totalSteps: this.tutorialSystem.getTotalSteps(),
      firstTimePlayer: this.tutorialSystem.isFirstTimePlayer(),
      currentStepData: this.tutorialSystem.getCurrentStep()
    }
  }
}