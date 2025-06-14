import { Game } from '@/game/Game'

export interface PerformanceStats {
  fps: number
  entities: number
  missiles: number
  poolUtilization: number
  poolActive: number
  poolTotal: number
  collisionChecks: number
  collisionSkipped: number
  collisionImprovement: number
}

export class DebugUIManager {
  private game: Game
  private panel: HTMLElement | null = null
  private isVisible = false
  private updateInterval: number | null = null
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 0

  constructor(game: Game) {
    this.game = game
    this.createUI()
    this.setupEventListeners()
    this.startPerformanceMonitoring()
  }

  private createUI(): void {
    // デバッグパネルのHTML構造を作成
    const panelHTML = `
      <div id="debug-panel" class="debug-panel collapsed">
        <div class="debug-header">
          <h3>🎯 ゲームデバッグコンソール</h3>
          <button id="toggle-panel" class="toggle-btn">📊</button>
        </div>
        
        <div class="debug-content">
          <!-- パフォーマンス監視 -->
          <div class="debug-section">
            <h4>⚡ パフォーマンス</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">FPS:</span>
                <span id="fps-value" class="stat-value">60</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">エンティティ:</span>
                <span id="entities-value" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">ミサイル:</span>
                <span id="missiles-value" class="stat-value">0</span>
              </div>
            </div>
          </div>

          <!-- プール統計 -->
          <div class="debug-section">
            <h4>🔧 オブジェクトプール</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">使用率:</span>
                <span id="pool-utilization" class="stat-value">0%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">アクティブ:</span>
                <span id="pool-active" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">総数:</span>
                <span id="pool-total" class="stat-value">0</span>
              </div>
            </div>
            <div class="progress-bar">
              <div id="pool-progress" class="progress-fill"></div>
            </div>
          </div>

          <!-- ミサイルテスト -->
          <div class="debug-section">
            <h4>🚀 ミサイルテスト</h4>
            <div class="button-grid">
              <button id="test-single" class="debug-btn primary">
                <span class="btn-icon">🎯</span>
                <span>単発テスト</span>
              </button>
              <button id="test-barrage" class="debug-btn warning">
                <span class="btn-icon">💥</span>
                <span>大量発射(100発)</span>
              </button>
              <button id="test-storm" class="debug-btn danger">
                <span class="btn-icon">🌪️</span>
                <span>ミサイル嵐(10秒)</span>
              </button>
              <button id="test-pool-visibility" class="debug-btn info">
                <span class="btn-icon">🔍</span>
                <span>プール可視テスト</span>
              </button>
            </div>
            
            <!-- カスタムテスト -->
            <div class="custom-test">
              <div class="input-group">
                <label for="missile-count">ミサイル数:</label>
                <input id="missile-count" type="number" value="50" min="1" max="2000">
                <button id="test-custom" class="debug-btn secondary">実行</button>
              </div>
            </div>
          </div>

          <!-- ゲーム制御 -->
          <div class="debug-section">
            <h4>🎮 ゲーム制御</h4>
            <div class="button-grid">
              <button id="restart-game" class="debug-btn success">
                <span class="btn-icon">🔄</span>
                <span>ゲーム再スタート</span>
              </button>
              <button id="toggle-pooling" class="debug-btn info">
                <span class="btn-icon">🔧</span>
                <span>プール切替</span>
              </button>
              <button id="show-stats" class="debug-btn info">
                <span class="btn-icon">📊</span>
                <span>統計表示</span>
              </button>
              <button id="clear-console" class="debug-btn secondary">
                <span class="btn-icon">🗑️</span>
                <span>ログクリア</span>
              </button>
            </div>
          </div>
          
          <!-- パフォーマンス最適化 -->
          <div class="debug-section">
            <h4>🚀 パフォーマンス最適化</h4>
            <div class="button-grid">
              <button id="enable-batch" class="debug-btn success">
                <span class="btn-icon">🎨</span>
                <span>バッチ最適化有効</span>
              </button>
              <button id="disable-batch" class="debug-btn warning">
                <span class="btn-icon">⏸️</span>
                <span>バッチ最適化無効</span>
              </button>
              <button id="performance-report" class="debug-btn info">
                <span class="btn-icon">📈</span>
                <span>パフォーマンス報告</span>
              </button>
              <button id="benchmark-rendering" class="debug-btn danger">
                <span class="btn-icon">🏁</span>
                <span>レンダリングベンチマーク</span>
              </button>
            </div>
            
            <div class="benchmark-info">
              <small>🚀 Graphics→Sprite変換でレンダリングを最適化</small>
            </div>
          </div>
          
          <!-- タワーシステムテスト -->
          <div class="debug-section">
            <h4>🏗️ タワーシステム</h4>
            <div class="button-grid">
              <button id="test-basic-tower" class="debug-btn info">
                <span class="btn-icon">🏢</span>
                <span>ベーシック配置</span>
              </button>
              <button id="test-rapid-tower" class="debug-btn warning">
                <span class="btn-icon">🔥</span>
                <span>ラピッド配置</span>
              </button>
              <button id="test-heavy-tower" class="debug-btn danger">
                <span class="btn-icon">💣</span>
                <span>ヘビー配置</span>
              </button>
              <button id="test-sniper-tower" class="debug-btn primary">
                <span class="btn-icon">🎯</span>
                <span>スナイパー配置</span>
              </button>
              <button id="test-splash-tower" class="debug-btn success">
                <span class="btn-icon">💥</span>
                <span>スプラッシュ配置</span>
              </button>
              <button id="show-tower-stats" class="debug-btn secondary">
                <span class="btn-icon">📊</span>
                <span>タワー統計</span>
              </button>
            </div>
            
            <div class="benchmark-info">
              <small>🏗️ 異なる特性を持つタワータイプをテスト</small>
            </div>
          </div>
          
          <!-- パフォーマンスベンチマーク -->
          <div class="debug-section">
            <h4>⚡ パフォーマンスベンチマーク</h4>
            <div class="button-grid">
              <button id="benchmark-collision" class="debug-btn warning">
                <span class="btn-icon">🏁</span>
                <span>衝突判定(500発)</span>
              </button>
              <button id="show-collision-stats" class="debug-btn info">
                <span class="btn-icon">🗺️</span>
                <span>衝突統計</span>
              </button>
              <button id="debug-entities" class="debug-btn secondary">
                <span class="btn-icon">📋</span>
                <span>エンティティ状態</span>
              </button>
              <button id="fix-missiles" class="debug-btn warning">
                <span class="btn-icon">🔧</span>
                <span>ミサイル修正</span>
              </button>
              <button id="force-fix-visibility" class="debug-btn danger">
                <span class="btn-icon">👁️</span>
                <span>可視性強制修正</span>
              </button>
            </div>
            
            <!-- カスタムベンチマーク -->
            <div class="custom-test">
              <div class="input-group">
                <label for="benchmark-count">ベンチマーク数:</label>
                <input id="benchmark-count" type="number" value="500" min="100" max="2000">
                <button id="benchmark-custom" class="debug-btn secondary">実行</button>
              </div>
            </div>
            
            <div class="benchmark-info">
              <small>⚡ 空間分割による衝突判定の最適化をテストします</small>
            </div>
          </div>
          
          <!-- パーティクルエフェクト -->
          <div class="debug-section">
            <h4>🎆 パーティクルエフェクト</h4>
            <div class="button-grid">
              <button id="test-particles" class="debug-btn danger">
                <span class="btn-icon">💥</span>
                <span>爆発テスト</span>
              </button>
              <button id="clear-particles" class="debug-btn secondary">
                <span class="btn-icon">🧨</span>
                <span>パーティクルクリア</span>
              </button>
            </div>
            
            <!-- パーティクル統計 -->
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">アクティブ:</span>
                <span id="particle-active" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">使用率:</span>
                <span id="particle-utilization" class="stat-value">0%</span>
              </div>
            </div>
            
            <div class="benchmark-info">
              <small>🎆 ミサイル爆発、ヒットスパーク、衝撃波エフェクト</small>
            </div>
          </div>

          <!-- 衝突判定最適化 -->
          <div class="debug-section">
            <h4>✨ 衝突判定最適化</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">チェック数:</span>
                <span id="collision-checks" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">スキップ数:</span>
                <span id="collision-skipped" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">改善率:</span>
                <span id="collision-improvement" class="stat-value">0%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">空間分割:</span>
                <span class="stat-value enabled">有効</span>
              </div>
            </div>
          </div>

          <!-- ウェーブシステム -->
          <div class="debug-section">
            <h4>🌊 ウェーブシステム</h4>
            
            <!-- 現在のウェーブ情報 -->
            <div class="wave-status">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">現在ウェーブ:</span>
                  <span id="wave-number" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">状態:</span>
                  <span id="wave-status" class="stat-value">準備中</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">敵出現:</span>
                  <span id="enemies-spawned" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">敵残り:</span>
                  <span id="enemies-remaining" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">敵撃破:</span>
                  <span id="enemies-killed" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">次ウェーブまで:</span>
                  <span id="next-wave-countdown" class="stat-value">-</span>
                </div>
              </div>
              
              <!-- ウェーブ進行バー -->
              <div class="wave-progress-section">
                <span class="stat-label">ウェーブ進行:</span>
                <div class="progress-bar">
                  <div id="wave-progress" class="progress-fill"></div>
                </div>
                <span id="wave-progress-text" class="progress-text">0%</span>
              </div>
            </div>
            
            <!-- 次ウェーブプレビュー -->
            <div class="next-wave-preview">
              <h5>🔮 次ウェーブプレビュー</h5>
              <div class="preview-stats">
                <div class="stat-item">
                  <span class="stat-label">ウェーブ:</span>
                  <span id="next-wave-number" class="stat-value">1</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">敵総数:</span>
                  <span id="next-wave-enemies" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">ボスウェーブ:</span>
                  <span id="next-wave-boss" class="stat-value">いいえ</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">報酬:</span>
                  <span id="next-wave-reward" class="stat-value">0 コイン</span>
                </div>
              </div>
              <div class="enemy-types-preview">
                <span class="stat-label">敵タイプ:</span>
                <div id="next-wave-types" class="enemy-types-list">basic, fast</div>
              </div>
            </div>
            
            <!-- ウェーブ制御ボタン -->
            <div class="button-grid">
              <button id="force-next-wave" class="debug-btn primary">
                <span class="btn-icon">⏭️</span>
                <span>次ウェーブ開始</span>
              </button>
              <button id="show-wave-info" class="debug-btn info">
                <span class="btn-icon">📊</span>
                <span>ウェーブ詳細</span>
              </button>
              <button id="test-enemy-basic" class="debug-btn secondary">
                <span class="btn-icon">👹</span>
                <span>ベーシック敵テスト</span>
              </button>
              <button id="test-enemy-fast" class="debug-btn warning">
                <span class="btn-icon">💨</span>
                <span>高速敵テスト</span>
              </button>
              <button id="test-enemy-heavy" class="debug-btn danger">
                <span class="btn-icon">🛡️</span>
                <span>重装敵テスト</span>
              </button>
              <button id="test-enemy-armored" class="debug-btn info">
                <span class="btn-icon">🔰</span>
                <span>装甲敵テスト</span>
              </button>
              <button id="test-enemy-boss" class="debug-btn danger">
                <span class="btn-icon">👑</span>
                <span>ボス敵テスト</span>
              </button>
            </div>
            
            <div class="benchmark-info">
              <small>🌊 段階的難易度調整・5種類敵タイプ・ボスウェーブシステム</small>
            </div>
          </div>

          <!-- システム情報 -->
          <div class="debug-section">
            <h4>📋 システム情報</h4>
            <div class="system-info">
              <div class="info-item">
                <span class="info-label">プール状態:</span>
                <span id="pooling-status" class="info-value enabled">有効</span>
              </div>
              <div class="info-item">
                <span class="info-label">最後の操作:</span>
                <span id="last-action" class="info-value">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // HTMLをドキュメントに追加
    const panelContainer = document.createElement('div')
    panelContainer.innerHTML = panelHTML
    document.body.appendChild(panelContainer)

    this.panel = document.getElementById('debug-panel')
  }

  private setupEventListeners(): void {
    // パネル表示/非表示切り替え
    const toggleBtn = document.getElementById('toggle-panel')
    toggleBtn?.addEventListener('click', () => this.togglePanel())

    // キーボードショートカット (Ctrl+D でパネル切り替え)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        this.togglePanel()
      }
    })

    // ミサイルテストボタン
    document.getElementById('test-single')?.addEventListener('click', () => {
      this.executeCommand('single', () => this.game.forceCreateMissile())
    })

    document.getElementById('test-barrage')?.addEventListener('click', () => {
      this.executeCommand('barrage', () => this.game.testMassiveMissileBarrage(100))
    })

    document.getElementById('test-storm')?.addEventListener('click', () => {
      this.executeCommand('storm', () => this.game.testContinuousMissileStorm(50, 10))
    })

    document.getElementById('test-custom')?.addEventListener('click', () => {
      const countInput = document.getElementById('missile-count') as HTMLInputElement
      const count = parseInt(countInput.value) || 50
      this.executeCommand(`custom(${count})`, () => this.game.testMassiveMissileBarrage(count))
    })

    // ゲーム制御ボタン
    document.getElementById('restart-game')?.addEventListener('click', () => {
      this.executeCommand('restart', () => {
        console.log('🔄 Restarting game via Debug UI...')
        this.game.restartGame()
      })
    })

    document.getElementById('toggle-pooling')?.addEventListener('click', () => {
      this.executeCommand('pooling', () => this.game.togglePooling())
      this.updatePoolingStatus()
    })

    document.getElementById('show-stats')?.addEventListener('click', () => {
      this.executeCommand('stats', () => this.game.showPoolStats())
    })

    document.getElementById('clear-console')?.addEventListener('click', () => {
      this.executeCommand('clear', () => console.clear())
    })
    
    // パフォーマンスベンチマークボタン
    document.getElementById('benchmark-collision')?.addEventListener('click', () => {
      this.executeCommand('benchmark', () => this.game.benchmarkCollisionSystem(500))
    })
    
    document.getElementById('show-collision-stats')?.addEventListener('click', () => {
      this.executeCommand('collision-stats', () => this.game.showCollisionStats())
    })
    
    document.getElementById('benchmark-custom')?.addEventListener('click', () => {
      const countInput = document.getElementById('benchmark-count') as HTMLInputElement
      const count = parseInt(countInput.value) || 500
      this.executeCommand(`benchmark(${count})`, () => this.game.benchmarkCollisionSystem(count))
    })
    
    // パーティクルエフェクトボタン
    document.getElementById('test-particles')?.addEventListener('click', () => {
      this.executeCommand('particles', () => this.game.testParticleEffects())
    })
    
    document.getElementById('clear-particles')?.addEventListener('click', () => {
      this.executeCommand('clear-particles', () => {
        this.game.getGameSystem().getParticleSystem().clear()
        console.log('🧨 All particles cleared')
      })
    })
    
    // プール可視性テストボタン
    document.getElementById('test-pool-visibility')?.addEventListener('click', () => {
      this.executeCommand('pool-visibility', () => {
        const enemies = this.game.getEntityManager().getEntitiesByType('enemy')
        if (enemies.length > 0) {
          const target = enemies[0]
          console.log('🔍 Testing pooled missile visibility...')
          
          // プールからミサイルを取得して可視性をテスト
          const missile = this.game.getGameSystem().getEntityFactory().createMissile(400, 300, target, 25)
          console.log(`Created missile ${missile.id} - should be visible now`)
          
          // 3秒後に状態確認
          setTimeout(() => {
            console.log(`🔍 Missile ${missile.id} status after 3s:`)
            console.log(`  - Active: ${missile.isEntityActive()}`)
            console.log(`  - Container visible: ${missile.container.visible}`)
            console.log(`  - Container children: ${missile.container.children.length}`)
            
            const renderable = missile.getComponent('renderable')
            if (renderable && (renderable as any).displayObject) {
              console.log(`  - Renderable visible: ${(renderable as any).displayObject.visible}`)
            }
          }, 3000)
        } else {
          console.warn('No enemies available for pool visibility test')
        }
      })
    })
    
    // エンティティデバッグボタン
    document.getElementById('debug-entities')?.addEventListener('click', () => {
      this.executeCommand('debug-entities', () => this.game.debugEntityManager())
    })
    
    // ミサイル修正ボタン
    document.getElementById('fix-missiles')?.addEventListener('click', () => {
      this.executeCommand('fix-missiles', () => this.game.forceHideInactiveMissiles())
    })
    
    // 可視性強制修正ボタン
    document.getElementById('force-fix-visibility')?.addEventListener('click', () => {
      this.executeCommand('force-fix-visibility', () => {
        this.game.getGameSystem().forceFixMissileVisibility()
      })
    })
    
    // パフォーマンス最適化ボタン
    document.getElementById('enable-batch')?.addEventListener('click', () => {
      this.executeCommand('enable-batch', () => this.game.enableBatchOptimization())
    })
    
    document.getElementById('disable-batch')?.addEventListener('click', () => {
      this.executeCommand('disable-batch', () => this.game.disableBatchOptimization())
    })
    
    document.getElementById('performance-report')?.addEventListener('click', () => {
      this.executeCommand('performance-report', () => this.game.showPerformanceReport())
    })
    
    document.getElementById('benchmark-rendering')?.addEventListener('click', () => {
      this.executeCommand('benchmark-rendering', () => this.game.benchmarkRendering(10))
    })
    
    // タワーシステムテストボタン
    document.getElementById('test-basic-tower')?.addEventListener('click', () => {
      this.executeCommand('test-basic-tower', () => {
        const x = 400 + Math.random() * 200
        const y = 200 + Math.random() * 200
        this.game.getGameSystem().createTower(x, y, 'basic')
        console.log(`🏢 Created Basic Tower at (${x.toFixed(0)}, ${y.toFixed(0)})`)
      })
    })
    
    document.getElementById('test-rapid-tower')?.addEventListener('click', () => {
      this.executeCommand('test-rapid-tower', () => {
        const x = 400 + Math.random() * 200
        const y = 200 + Math.random() * 200
        this.game.getGameSystem().createTower(x, y, 'rapid')
        console.log(`🔥 Created Rapid Tower at (${x.toFixed(0)}, ${y.toFixed(0)})`)
      })
    })
    
    document.getElementById('test-heavy-tower')?.addEventListener('click', () => {
      this.executeCommand('test-heavy-tower', () => {
        const x = 400 + Math.random() * 200
        const y = 200 + Math.random() * 200
        this.game.getGameSystem().createTower(x, y, 'heavy')
        console.log(`💣 Created Heavy Tower at (${x.toFixed(0)}, ${y.toFixed(0)})`)
      })
    })
    
    document.getElementById('test-sniper-tower')?.addEventListener('click', () => {
      this.executeCommand('test-sniper-tower', () => {
        const x = 400 + Math.random() * 200
        const y = 200 + Math.random() * 200
        this.game.getGameSystem().createTower(x, y, 'sniper')
        console.log(`🎯 Created Sniper Tower at (${x.toFixed(0)}, ${y.toFixed(0)})`)
      })
    })
    
    document.getElementById('test-splash-tower')?.addEventListener('click', () => {
      this.executeCommand('test-splash-tower', () => {
        const x = 400 + Math.random() * 200
        const y = 200 + Math.random() * 200
        this.game.getGameSystem().createTower(x, y, 'splash')
        console.log(`💥 Created Splash Tower at (${x.toFixed(0)}, ${y.toFixed(0)})`)
      })
    })
    
    document.getElementById('show-tower-stats')?.addEventListener('click', () => {
      this.executeCommand('show-tower-stats', () => {
        const entities = this.game.getEntityManager().getEntities()
        const towers = entities.filter(e => e.type === 'tower')
        
        console.log('🏗️ Tower Statistics:')
        towers.forEach((tower, index) => {
          const towerComponent = tower.getComponent('tower')
          const transform = tower.getComponent('transform')
          
          if (towerComponent && transform) {
            console.log(`  ${index + 1}. ${(towerComponent as any).config.name} at (${(transform as any).x}, ${(transform as any).y})`)
            console.log(`     Level: ${(towerComponent as any).level}`)
            console.log(`     Shots: ${(towerComponent as any).totalShotsFired}`)
            console.log(`     Kills: ${(towerComponent as any).totalKills}`)
            console.log(`     Damage: ${(towerComponent as any).totalDamageDealt}`)
            console.log(`     Efficiency: ${(towerComponent as any).getEfficiency().toFixed(1)}%`)
          }
        })
        
        console.log(`📊 Total Towers: ${towers.length}`)
      })
    })
    
    // ウェーブシステムボタン
    document.getElementById('force-next-wave')?.addEventListener('click', () => {
      this.executeCommand('force-next-wave', () => {
        this.game.forceStartNextWave()
        console.log('⏭️ Forced next wave to start')
      })
    })
    
    document.getElementById('show-wave-info')?.addEventListener('click', () => {
      this.executeCommand('show-wave-info', () => this.game.showWaveInfo())
    })
    
    // 敵タイプテストボタン
    document.getElementById('test-enemy-basic')?.addEventListener('click', () => {
      this.executeCommand('test-enemy-basic', () => {
        this.game.testSpecificEnemyType('basic')
        console.log('👹 Spawned Basic enemy for testing')
      })
    })
    
    document.getElementById('test-enemy-fast')?.addEventListener('click', () => {
      this.executeCommand('test-enemy-fast', () => {
        this.game.testSpecificEnemyType('fast')
        console.log('💨 Spawned Fast enemy for testing')
      })
    })
    
    document.getElementById('test-enemy-heavy')?.addEventListener('click', () => {
      this.executeCommand('test-enemy-heavy', () => {
        this.game.testSpecificEnemyType('heavy')
        console.log('🛡️ Spawned Heavy enemy for testing')
      })
    })
    
    document.getElementById('test-enemy-armored')?.addEventListener('click', () => {
      this.executeCommand('test-enemy-armored', () => {
        this.game.testSpecificEnemyType('armored')
        console.log('🔰 Spawned Armored enemy for testing')
      })
    })
    
    document.getElementById('test-enemy-boss')?.addEventListener('click', () => {
      this.executeCommand('test-enemy-boss', () => {
        this.game.testSpecificEnemyType('boss')
        console.log('👑 Spawned Boss enemy for testing')
      })
    })
  }

  private executeCommand(action: string, command: () => void): void {
    try {
      command()
      this.updateLastAction(action)
    } catch (error) {
      console.error(`Command failed: ${action}`, error)
      this.updateLastAction(`${action} (エラー)`)
    }
  }

  private updateLastAction(action: string): void {
    const element = document.getElementById('last-action')
    if (element) {
      element.textContent = `${new Date().toLocaleTimeString()} - ${action}`
    }
  }

  private togglePanel(): void {
    if (!this.panel) return

    this.isVisible = !this.isVisible
    
    if (this.isVisible) {
      this.panel.classList.remove('collapsed')
      this.panel.classList.add('expanded')
    } else {
      this.panel.classList.remove('expanded')
      this.panel.classList.add('collapsed')
    }
  }

  private startPerformanceMonitoring(): void {
    // FPS計算
    const updateFPS = () => {
      this.frameCount++
      const currentTime = performance.now()
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
        this.frameCount = 0
        this.lastTime = currentTime
      }
      
      requestAnimationFrame(updateFPS)
    }
    updateFPS()

    // UIの定期更新 (500ms間隔)
    this.updateInterval = window.setInterval(() => {
      this.updateStats()
    }, 500)
  }

  private updateStats(): void {
    if (!this.isVisible) return

    try {
      // FPS更新
      const fpsElement = document.getElementById('fps-value')
      if (fpsElement) {
        fpsElement.textContent = this.fps.toString()
        fpsElement.className = `stat-value ${this.getFPSClass(this.fps)}`
      }

      // エンティティ数更新
      const entityManager = this.game.getEntityManager()
      const entities = entityManager.getEntities()
      const missiles = entities.filter(e => e.type === 'missile')

      this.updateElement('entities-value', entities.length.toString())
      this.updateElement('missiles-value', missiles.length.toString())

      // プール統計更新
      const poolStats = this.game.getGameSystem().getPoolStats()
      if (poolStats && poolStats.missile) {
        const utilization = Math.round(poolStats.missile.utilization * 100)
        this.updateElement('pool-utilization', `${utilization}%`)
        this.updateElement('pool-active', poolStats.missile.active.toString())
        this.updateElement('pool-total', poolStats.missile.total.toString())

        // プログレスバー更新
        const progressBar = document.getElementById('pool-progress')
        if (progressBar) {
          progressBar.style.width = `${utilization}%`
          progressBar.className = `progress-fill ${this.getUtilizationClass(utilization)}`
        }
      }
      
      // 衝突判定統計更新
      const collisionStats = this.game.getGameSystem().getCollisionStats()
      if (collisionStats) {
        this.updateElement('collision-checks', collisionStats.checksPerformed.toString())
        this.updateElement('collision-skipped', collisionStats.checksSkipped.toString())
        
        const improvement = this.game.getGameSystem().getCollisionStats().spatialHashStats
          ? ((collisionStats.checksSkipped / (collisionStats.checksPerformed + collisionStats.checksSkipped)) * 100).toFixed(1)
          : '0.0'
        this.updateElement('collision-improvement', `${improvement}%`)
        
        // 改善率によって色分け
        const improvementElement = document.getElementById('collision-improvement')
        if (improvementElement) {
          const improvementValue = parseFloat(improvement)
          improvementElement.className = `stat-value ${this.getImprovementClass(improvementValue)}`
        }
      }
      
      // パーティクル統計更新
      const particleStats = this.game.getGameSystem().getParticleSystem().getStats()
      if (particleStats) {
        this.updateElement('particle-active', particleStats.activeParticles.toString())
        this.updateElement('particle-utilization', `${particleStats.utilization.toFixed(1)}%`)
        
        // パーティクル使用率によって色分け
        const utilizationElement = document.getElementById('particle-utilization')
        if (utilizationElement) {
          utilizationElement.className = `stat-value ${this.getUtilizationClass(particleStats.utilization)}`
        }
      }
      
      // ウェーブシステム統計更新
      this.updateWaveStats()
    } catch (error) {
      console.warn('Stats update failed:', error)
    }
  }

  private updateWaveStats(): void {
    try {
      const currentWave = this.game.getCurrentWave()
      const waveProgress = this.game.getWaveProgress()
      
      // 現在のウェーブ情報更新
      this.updateElement('wave-number', currentWave.toString())
      this.updateElement('enemies-spawned', waveProgress.enemiesSpawned.toString())
      this.updateElement('enemies-remaining', waveProgress.enemiesRemaining.toString())
      this.updateElement('enemies-killed', waveProgress.enemiesKilled.toString())
      
      // ウェーブ状態の更新と色分け
      const statusMap = {
        'preparing': '準備中',
        'active': '進行中',
        'completed': '完了',
        'failed': '失敗'
      }
      const statusText = statusMap[waveProgress.status] || waveProgress.status
      this.updateElement('wave-status', statusText)
      
      const statusElement = document.getElementById('wave-status')
      if (statusElement) {
        statusElement.className = `stat-value ${this.getWaveStatusClass(waveProgress.status)}`
      }
      
      // 次ウェーブまでのカウントダウン
      if (waveProgress.nextWaveIn > 0) {
        const seconds = Math.ceil(waveProgress.nextWaveIn / 1000)
        this.updateElement('next-wave-countdown', `${seconds}秒`)
      } else {
        this.updateElement('next-wave-countdown', '-')
      }
      
      // ウェーブ進行状況バー
      let progressPercentage = 0
      if (waveProgress.status === 'active') {
        const totalEnemies = waveProgress.enemiesSpawned + waveProgress.enemiesRemaining
        if (totalEnemies > 0) {
          progressPercentage = Math.round(((waveProgress.enemiesSpawned + waveProgress.enemiesKilled) / totalEnemies) * 100)
        }
      } else if (waveProgress.status === 'completed') {
        progressPercentage = 100
      }
      
      this.updateElement('wave-progress-text', `${progressPercentage}%`)
      const progressBar = document.getElementById('wave-progress')
      if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`
        progressBar.className = `progress-fill ${this.getProgressClass(progressPercentage)}`
      }
      
      // 次ウェーブプレビュー
      const nextWaveNumber = currentWave + 1
      const waveSystem = this.game.getGameSystem().getWaveSystem()
      const nextWaveInfo = waveSystem.getWaveInfo(nextWaveNumber)
      
      this.updateElement('next-wave-number', nextWaveNumber.toString())
      this.updateElement('next-wave-enemies', nextWaveInfo.totalEnemies.toString())
      this.updateElement('next-wave-boss', nextWaveInfo.bossWave ? 'はい' : 'いいえ')
      this.updateElement('next-wave-reward', `${nextWaveInfo.rewards.money} コイン`)
      
      // ボスウェーブの場合は色を変更
      const bossElement = document.getElementById('next-wave-boss')
      if (bossElement) {
        bossElement.className = `stat-value ${nextWaveInfo.bossWave ? 'boss-wave' : ''}`
      }
      
      // 敵タイプリスト
      const enemyTypesText = nextWaveInfo.enemyTypes.join(', ')
      this.updateElement('next-wave-types', enemyTypesText)
      
    } catch (error) {
      console.warn('Wave stats update failed:', error)
    }
  }

  private updateElement(id: string, value: string): void {
    const element = document.getElementById(id)
    if (element) {
      element.textContent = value
    }
  }

  private getFPSClass(fps: number): string {
    if (fps >= 55) return 'good'
    if (fps >= 30) return 'warning'
    return 'danger'
  }

  private getUtilizationClass(utilization: number): string {
    if (utilization < 50) return 'low'
    if (utilization < 80) return 'medium'
    return 'high'
  }
  
  private getImprovementClass(improvement: number): string {
    if (improvement >= 80) return 'good'
    if (improvement >= 50) return 'warning'
    return 'danger'
  }
  
  private getWaveStatusClass(status: string): string {
    switch (status) {
      case 'preparing': return 'warning'
      case 'active': return 'good'
      case 'completed': return 'success'
      case 'failed': return 'danger'
      default: return ''
    }
  }
  
  private getProgressClass(percentage: number): string {
    if (percentage >= 75) return 'high'
    if (percentage >= 25) return 'medium'
    return 'low'
  }

  private updatePoolingStatus(): void {
    const element = document.getElementById('pooling-status')
    if (element) {
      const isEnabled = this.game.getGameSystem().isPoolingEnabled()
      element.textContent = isEnabled ? '有効' : '無効'
      element.className = `info-value ${isEnabled ? 'enabled' : 'disabled'}`
    }
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    
    if (this.panel) {
      this.panel.remove()
    }
  }

  public show(): void {
    if (!this.isVisible) {
      this.togglePanel()
    }
  }

  public hide(): void {
    if (this.isVisible) {
      this.togglePanel()
    }
  }
}