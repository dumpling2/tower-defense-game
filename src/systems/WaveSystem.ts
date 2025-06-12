import { EnemyType, getEnemyConfig, ENEMY_WAVE_PATTERNS } from '@/entities/types/EnemyTypes'
import { GameState } from '@/game/GameState'
import { GameSystem } from './GameSystem'

export interface WaveConfig {
  waveNumber: number
  totalEnemies: number
  enemyTypes: EnemyType[]
  spawnInterval: number  // milliseconds between spawns
  difficultyMultiplier: number
  bossWave: boolean
  rewards: {
    money: number
    experience: number
  }
}

export interface EnemySpawn {
  type: EnemyType
  spawnTime: number  // when to spawn relative to wave start
  count: number
}

export interface WaveProgress {
  waveNumber: number
  enemiesSpawned: number
  enemiesRemaining: number
  enemiesKilled: number
  waveStartTime: number
  status: 'preparing' | 'active' | 'completed' | 'failed'
  nextWaveIn: number  // countdown to next wave
}

/**
 * ウェーブ管理システム
 * 敵の段階的出現、難易度調整、報酬管理を担当
 */
export class WaveSystem {
  private gameState: GameState
  private gameSystem: GameSystem
  private currentWave: number = 0
  private waveProgress: WaveProgress
  private spawnQueue: EnemySpawn[] = []
  private waveActive: boolean = false
  private preparationTime: number = 10000 // 10秒の準備時間
  private lastWaveEndTime: number = 0
  
  // パス設定
  private enemyPath: { x: number; y: number }[] = []

  constructor(gameState: GameState, gameSystem: GameSystem) {
    this.gameState = gameState
    this.gameSystem = gameSystem
    
    this.waveProgress = {
      waveNumber: 0,
      enemiesSpawned: 0,
      enemiesRemaining: 0,
      enemiesKilled: 0,
      waveStartTime: 0,
      status: 'preparing',
      nextWaveIn: this.preparationTime
    }
    
    // デフォルトパス設定
    this.setEnemyPath([
      { x: 50, y: 400 },
      { x: 200, y: 400 },
      { x: 400, y: 300 },
      { x: 600, y: 400 },
      { x: 800, y: 400 },
      { x: 1000, y: 400 },
      { x: 1150, y: 400 }
    ])
  }

  public setEnemyPath(path: { x: number; y: number }[]): void {
    this.enemyPath = path
  }

  public update(deltaTime: number): void {
    void deltaTime // 未使用パラメータ警告回避
    const currentTime = Date.now()
    
    switch (this.waveProgress.status) {
      case 'preparing':
        this.updatePreparation(currentTime)
        break
      case 'active':
        this.updateActiveWave(currentTime)
        break
      case 'completed':
        this.updateWaveCompletion(currentTime)
        break
    }
    
    // 統計更新
    this.updateWaveStatistics()
  }

  private updatePreparation(currentTime: number): void {
    this.waveProgress.nextWaveIn = Math.max(0, this.preparationTime - (currentTime - this.lastWaveEndTime))
    
    if (this.waveProgress.nextWaveIn <= 0) {
      this.startNextWave()
    }
  }

  private updateActiveWave(currentTime: number): void {
    // 敵をスポーン
    this.processEnemySpawns(currentTime)
    
    // ウェーブ完了チェック
    if (this.isWaveCompleted()) {
      this.completeWave()
    }
  }

  private updateWaveCompletion(currentTime: number): void {
    this.waveProgress.nextWaveIn = Math.max(0, this.preparationTime - (currentTime - this.lastWaveEndTime))
    
    if (this.waveProgress.nextWaveIn <= 0) {
      this.waveProgress.status = 'preparing'
    }
  }

  private startNextWave(): void {
    this.currentWave++
    this.waveProgress.waveNumber = this.currentWave
    this.waveProgress.status = 'active'
    this.waveProgress.waveStartTime = Date.now()
    this.waveProgress.enemiesSpawned = 0
    this.waveProgress.enemiesKilled = 0
    
    // ウェーブ設定を生成
    const waveConfig = this.generateWaveConfig(this.currentWave)
    this.spawnQueue = this.generateSpawnQueue(waveConfig)
    this.waveProgress.enemiesRemaining = waveConfig.totalEnemies
    
    this.waveActive = true
    
    console.log(`🌊 Wave ${this.currentWave} started!`)
    console.log(`  - Enemies: ${waveConfig.totalEnemies}`)
    console.log(`  - Types: ${waveConfig.enemyTypes.join(', ')}`)
    console.log(`  - Boss Wave: ${waveConfig.bossWave ? 'Yes' : 'No'}`)
  }

  private generateWaveConfig(waveNumber: number): WaveConfig {
    const isBossWave = waveNumber % 5 === 0 // 5ウェーブごとにボス
    const difficultyMultiplier = 1 + (waveNumber - 1) * 0.15 // 15%ずつ難易度上昇
    
    // 基本敵数（ウェーブごとに増加）
    const baseEnemies = Math.min(10 + Math.floor(waveNumber * 1.5), 30)
    const totalEnemies = Math.floor(baseEnemies * difficultyMultiplier)
    
    // ウェーブの段階に応じた敵タイプパターン選択
    let patternKey: keyof typeof ENEMY_WAVE_PATTERNS
    if (isBossWave) {
      patternKey = 'boss'
    } else if (waveNumber <= 3) {
      patternKey = 'early'
    } else if (waveNumber <= 7) {
      patternKey = 'mid'
    } else {
      patternKey = 'late'
    }
    
    const pattern = ENEMY_WAVE_PATTERNS[patternKey]
    
    return {
      waveNumber,
      totalEnemies,
      enemyTypes: pattern.types,
      spawnInterval: Math.max(300, 1000 - waveNumber * 50), // スポーン間隔を徐々に短縮
      difficultyMultiplier,
      bossWave: isBossWave,
      rewards: {
        money: Math.floor(50 + waveNumber * 20),
        experience: Math.floor(100 + waveNumber * 30)
      }
    }
  }

  private generateSpawnQueue(config: WaveConfig): EnemySpawn[] {
    const queue: EnemySpawn[] = []
    const pattern = this.getPatternForWave(config)
    
    let currentSpawnTime = 0
    let remainingEnemies = config.totalEnemies
    
    while (remainingEnemies > 0) {
      // パターンに基づいて敵タイプを選択
      const enemyType = this.selectEnemyType(pattern.types, pattern.weights)
      
      // スポーン数を決定（1-3体ずつ）
      const spawnCount = Math.min(remainingEnemies, Math.floor(Math.random() * 3) + 1)
      
      queue.push({
        type: enemyType,
        spawnTime: currentSpawnTime,
        count: spawnCount
      })
      
      currentSpawnTime += config.spawnInterval
      remainingEnemies -= spawnCount
    }
    
    return queue
  }

  private getPatternForWave(config: WaveConfig) {
    if (config.bossWave) {
      return ENEMY_WAVE_PATTERNS.boss
    } else if (config.waveNumber <= 3) {
      return ENEMY_WAVE_PATTERNS.early
    } else if (config.waveNumber <= 7) {
      return ENEMY_WAVE_PATTERNS.mid
    } else {
      return ENEMY_WAVE_PATTERNS.late
    }
  }

  private selectEnemyType(types: EnemyType[], weights: number[]): EnemyType {
    const random = Math.random()
    let cumulative = 0
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i]
      if (random <= cumulative) {
        return types[i]
      }
    }
    
    return types[types.length - 1]
  }

  private processEnemySpawns(currentTime: number): void {
    while (this.spawnQueue.length > 0 && 
           currentTime >= this.waveProgress.waveStartTime + this.spawnQueue[0].spawnTime) {
      
      const spawn = this.spawnQueue.shift()!
      
      for (let i = 0; i < spawn.count; i++) {
        this.spawnEnemy(spawn.type)
        this.waveProgress.enemiesSpawned++
      }
    }
  }

  private spawnEnemy(type: EnemyType): void {
    const config = getEnemyConfig(type)
    
    // 難易度に基づいて敵の能力を調整
    const difficultyMultiplier = 1 + (this.currentWave - 1) * 0.1
    const adjustedSpeed = config.speed * (0.8 + Math.random() * 0.4) // ±20%のランダム性
    
    const enemy = this.gameSystem.createEnemy(this.enemyPath, adjustedSpeed)
    
    // 敵タイプに応じた設定を適用
    this.applyEnemyConfig(enemy, config, difficultyMultiplier)
    
    console.log(`👹 Spawned ${config.name} (Wave ${this.currentWave})`)
  }

  private applyEnemyConfig(enemy: any, config: any, difficultyMultiplier: number): void {
    // ヘルス調整
    const health = enemy.getComponent('health')
    if (health) {
      const adjustedHealth = Math.floor(config.health * difficultyMultiplier)
      health.max = adjustedHealth
      health.current = adjustedHealth
    }
    
    // ビジュアル調整
    const renderable = enemy.getComponent('renderable')
    if (renderable) {
      renderable.setColor(config.visual.color)
      renderable.setSize(config.visual.size)
      renderable.drawAdvancedEnemy(config.visual)
    }
  }

  private isWaveCompleted(): boolean {
    const allEnemiesSpawned = this.spawnQueue.length === 0
    const allEnemiesDefeated = this.gameSystem.getActiveEnemyCount() === 0
    
    return allEnemiesSpawned && allEnemiesDefeated
  }

  private completeWave(): void {
    this.waveProgress.status = 'completed'
    this.waveActive = false
    this.lastWaveEndTime = Date.now()
    
    // 報酬付与
    const waveConfig = this.generateWaveConfig(this.currentWave)
    this.gameState.earnMoney(waveConfig.rewards.money)
    
    console.log(`✅ Wave ${this.currentWave} completed!`)
    console.log(`  - Reward: ${waveConfig.rewards.money} coins`)
    console.log(`  - Next wave in: ${this.preparationTime / 1000} seconds`)
  }

  private updateWaveStatistics(): void {
    // ゲーム状態の統計を更新
    this.gameState.setCurrentWave(this.currentWave)
  }

  // パブリックメソッド
  public getCurrentWave(): number {
    return this.currentWave
  }

  public getWaveProgress(): WaveProgress {
    return { ...this.waveProgress }
  }

  public forceStartNextWave(): void {
    if (this.waveProgress.status === 'preparing' || this.waveProgress.status === 'completed') {
      this.lastWaveEndTime = Date.now() - this.preparationTime
    }
  }

  public getWaveInfo(waveNumber: number): WaveConfig {
    return this.generateWaveConfig(waveNumber)
  }

  public isWaveActive(): boolean {
    return this.waveActive
  }

  public reset(): void {
    this.currentWave = 0
    this.waveActive = false
    this.spawnQueue = []
    this.lastWaveEndTime = Date.now()
    
    this.waveProgress = {
      waveNumber: 0,
      enemiesSpawned: 0,
      enemiesRemaining: 0,
      enemiesKilled: 0,
      waveStartTime: 0,
      status: 'preparing',
      nextWaveIn: this.preparationTime
    }
  }
}