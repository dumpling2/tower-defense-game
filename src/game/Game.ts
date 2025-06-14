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
  
  private lastTime = 0
  private isRunning = false

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
    this.physicsSystem = new PhysicsSystem()
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

  public start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.gameState.setState('playing')
    
    // 初期エンティティの作成
    this.initializeGame()
    
    // ゲームループ開始
    this.app.ticker.add(this.gameLoop, this)
    
    console.log('🚀 Game started!')
  }

  public stop(): void {
    this.isRunning = false
    this.app.ticker.remove(this.gameLoop, this)
    console.log('⏹️ Game stopped!')
  }

  public destroy(): void {
    this.stop()
    
    // UIのクリーンアップ
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
    
    if (this.renderSystem) {
      this.renderSystem.destroy()
    }
    
    console.log('🗑️ Game destroyed!')
  }

  private setupGameLoop(): void {
    this.app.ticker.maxFPS = 60
    this.app.ticker.minFPS = 30
  }

  private gameLoop(): void {
    if (!this.isRunning) return

    const currentTime = Date.now()
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) // 最大0.1秒に制限
    this.lastTime = currentTime

    // システム更新（順序重要）
    this.inputSystem.update()
    this.economySystem.update(deltaTime)
    this.gameSystem.update(deltaTime)
    this.physicsSystem.update(deltaTime, this.entityManager.getEntities())
    this.renderSystem.update(deltaTime, this.entityManager.getEntities())
    
    // UI更新
    this.economyUI.updateDisplay()
    
    // エンティティのクリーンアップ
    this.entityManager.cleanup()
  }

  private initializeGame(): void {
    console.log('🎯 Initializing tower defense game...')
    
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

    // 異なるタワータイプを配置（複数タワーシステムのデモ）
    this.gameSystem.createTower(300, 200, 'basic')     // ベーシックタワー
    this.gameSystem.createTower(500, 500, 'rapid')     // ラピッドタワー
    this.gameSystem.createTower(700, 200, 'heavy')     // ヘビータワー
    this.gameSystem.createTower(900, 500, 'sniper')    // スナイパータワー
    this.gameSystem.createTower(600, 350, 'splash')    // スプラッシュタワー

    // ウェーブシステムを初期化（従来の敵生成を置き換え）
    this.setupWaveSystem(samplePath)

    console.log('✅ Game initialized with towers and enemy spawn system')
    console.log('🎯 Use browser console commands:')
    console.log('  game.forceCreateMissile() - Create single missile for debugging')
    console.log('  game.testMassiveMissileBarrage(100) - Test 100 missiles')
    console.log('  game.showPoolStats() - Show pool statistics')
    console.log('  game.togglePooling() - Toggle object pooling')
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
}