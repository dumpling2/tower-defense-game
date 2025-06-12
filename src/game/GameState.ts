export type GameStateType = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory'

export class GameState {
  private currentState: GameStateType = 'menu'
  private score = 0
  private lives = 20
  private wave = 1
  private money = 100
  
  // ゲーム統計
  private enemiesKilled = 0
  private missileFired = 0

  public setState(state: GameStateType): void {
    const previousState = this.currentState
    this.currentState = state
    console.log(`🎮 Game state changed: ${previousState} → ${state}`)
  }

  public getState(): GameStateType {
    return this.currentState
  }

  public isPlaying(): boolean {
    return this.currentState === 'playing'
  }

  // スコア管理
  public getScore(): number {
    return this.score
  }

  public addScore(points: number): void {
    this.score += points
  }

  // ライフ管理
  public getLives(): number {
    return this.lives
  }

  public loseLife(): void {
    this.lives = Math.max(0, this.lives - 1)
    if (this.lives === 0) {
      this.setState('gameOver')
    }
  }

  // ウェーブ管理
  public getWave(): number {
    return this.wave
  }

  public setCurrentWave(wave: number): void {
    this.wave = wave
  }

  public nextWave(): void {
    this.wave++
    console.log(`🌊 Wave ${this.wave} started!`)
  }

  // 資金管理
  public getMoney(): number {
    return this.money
  }

  public spendMoney(amount: number): boolean {
    if (this.money >= amount) {
      this.money -= amount
      return true
    }
    return false
  }

  public earnMoney(amount: number): void {
    this.money += amount
  }

  // 統計
  public getEnemiesKilled(): number {
    return this.enemiesKilled
  }

  public incrementEnemiesKilled(): void {
    this.enemiesKilled++
  }

  public getMissileFired(): number {
    return this.missileFired
  }

  public incrementMissileFired(): void {
    this.missileFired++
  }

  // ゲーム状態のリセット
  public reset(): void {
    this.currentState = 'menu'
    this.score = 0
    this.lives = 20
    this.wave = 1
    this.money = 100
    this.enemiesKilled = 0
    this.missileFired = 0
  }
}