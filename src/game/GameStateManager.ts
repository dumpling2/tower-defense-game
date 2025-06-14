type GameStateType = 'menu' | 'playing' | 'paused' | 'settings' | 'gameOver'

interface GameStateManagerListener {
  onStateChanged(oldState: GameStateType, newState: GameStateType): void
}

export class GameStateManager {
  private currentState: GameStateType = 'menu'
  private previousState: GameStateType | null = null
  private listeners: GameStateManagerListener[] = []

  constructor() {
    console.log('🎮 GameStateManager initialized - Starting in menu state')
  }

  public getCurrentState(): GameStateType {
    return this.currentState
  }

  public getPreviousState(): GameStateType | null {
    return this.previousState
  }

  public setState(newState: GameStateType): void {
    if (this.currentState === newState) {
      return // 同じ状態の場合は何もしない
    }

    const oldState = this.currentState
    this.previousState = oldState
    this.currentState = newState

    console.log(`🔄 Game state changed: ${oldState} → ${newState}`)

    // リスナーに通知
    this.listeners.forEach(listener => {
      try {
        listener.onStateChanged(oldState, newState)
      } catch (error) {
        console.error('GameStateManager listener error:', error)
      }
    })
  }

  public addListener(listener: GameStateManagerListener): void {
    this.listeners.push(listener)
  }

  public removeListener(listener: GameStateManagerListener): void {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) {
      this.listeners.splice(index, 1)
    }
  }

  public isInGame(): boolean {
    return this.currentState === 'playing' || this.currentState === 'paused'
  }

  public isInMenu(): boolean {
    return this.currentState === 'menu' || this.currentState === 'settings'
  }

  public canPause(): boolean {
    return this.currentState === 'playing'
  }

  public canResume(): boolean {
    return this.currentState === 'paused'
  }

  public togglePause(): boolean {
    if (this.currentState === 'playing') {
      this.setState('paused')
      return true
    } else if (this.currentState === 'paused') {
      this.setState('playing')
      return true
    }
    return false
  }

  public returnToPreviousState(): void {
    if (this.previousState) {
      this.setState(this.previousState)
    }
  }

  public reset(): void {
    this.setState('menu')
    this.previousState = null
  }
}