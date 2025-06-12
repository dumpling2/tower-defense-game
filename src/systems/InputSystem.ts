export interface InputState {
  mouseX: number
  mouseY: number
  isMouseDown: boolean
  keys: Set<string>
}

export class InputSystem {
  private inputState: InputState = {
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false,
    keys: new Set()
  }

  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // マウスイベント
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    // キーボードイベント
    window.addEventListener('keydown', this.onKeyDown.bind(this))
    window.addEventListener('keyup', this.onKeyUp.bind(this))
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    this.inputState.mouseX = event.clientX - rect.left
    this.inputState.mouseY = event.clientY - rect.top
  }

  private onMouseDown(event: MouseEvent): void {
    this.inputState.isMouseDown = true
    event.preventDefault()
  }

  private onMouseUp(event: MouseEvent): void {
    this.inputState.isMouseDown = false
    event.preventDefault()
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.inputState.keys.add(event.code)
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.inputState.keys.delete(event.code)
  }

  public update(): void {
    // 入力状態の更新処理（必要に応じて）
  }

  public getInputState(): InputState {
    return this.inputState
  }

  public isKeyPressed(keyCode: string): boolean {
    return this.inputState.keys.has(keyCode)
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this.inputState.mouseX, y: this.inputState.mouseY }
  }

  public isMouseDown(): boolean {
    return this.inputState.isMouseDown
  }

  public destroy(): void {
    // イベントリスナーの削除
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this))
    window.removeEventListener('keydown', this.onKeyDown.bind(this))
    window.removeEventListener('keyup', this.onKeyUp.bind(this))
  }
}