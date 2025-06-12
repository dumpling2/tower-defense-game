import { Entity } from '@/entities/Entity'
import { Transform } from '@/entities/components/Transform'
import { Tower } from '@/entities/components/Tower'
import { EntityManager } from './EntityManager'
import { InputSystem } from './InputSystem'
import * as PIXI from 'pixi.js'

export interface TowerSelectionListener {
  onTowerSelected(tower: Entity): void
  onTowerDeselected(): void
}

/**
 * タワー選択システム
 * マウスクリックによるタワー選択とハイライト表示を管理
 */
export class TowerSelectionSystem {
  private entityManager: EntityManager
  private inputSystem: InputSystem
  private selectedTower: Entity | null = null
  private selectionHighlight: PIXI.Graphics | null = null
  private listeners: TowerSelectionListener[] = []
  private lastClickTime = 0
  private clickThreshold = 200 // ミリ秒

  constructor(entityManager: EntityManager, inputSystem: InputSystem) {
    this.entityManager = entityManager
    this.inputSystem = inputSystem
    this.createSelectionHighlight()
  }

  private createSelectionHighlight(): void {
    this.selectionHighlight = new PIXI.Graphics()
    this.selectionHighlight.visible = false
  }

  public update(): void {
    const inputState = this.inputSystem.getInputState()
    
    // マウスクリック検出
    if (inputState.isMouseDown) {
      const currentTime = Date.now()
      if (currentTime - this.lastClickTime > this.clickThreshold) {
        this.lastClickTime = currentTime
        this.handleClick(inputState.mouseX, inputState.mouseY)
      }
    }

    // 選択されたタワーのハイライト更新
    if (this.selectedTower && this.selectionHighlight) {
      this.updateHighlight()
    }
  }

  private handleClick(x: number, y: number): void {
    // クリック位置に最も近いタワーを検索
    const towers = this.entityManager.getEntitiesByType('tower')
    let closestTower: Entity | null = null
    let closestDistance = Infinity

    for (const tower of towers) {
      const transform = tower.getComponent<Transform>('transform')
      if (!transform) continue

      const distance = Math.sqrt(
        Math.pow(x - transform.x, 2) + 
        Math.pow(y - transform.y, 2)
      )

      // タワーのクリック判定半径（通常30ピクセル）
      const clickRadius = 30
      if (distance < clickRadius && distance < closestDistance) {
        closestDistance = distance
        closestTower = tower
      }
    }

    // タワーを選択または選択解除
    if (closestTower) {
      this.selectTower(closestTower)
    } else {
      this.deselectTower()
    }
  }

  public selectTower(tower: Entity): void {
    // 同じタワーが既に選択されている場合は何もしない
    if (this.selectedTower === tower) return

    // 前のタワーの選択を解除
    if (this.selectedTower) {
      this.deselectTower()
    }

    this.selectedTower = tower
    this.showHighlight(tower)

    // リスナーに通知
    for (const listener of this.listeners) {
      listener.onTowerSelected(tower)
    }

    console.log(`🏗️ Tower selected: ${tower.id}`)
  }

  public deselectTower(): void {
    if (!this.selectedTower) return

    this.hideHighlight()
    const previousTower = this.selectedTower
    this.selectedTower = null

    // リスナーに通知
    for (const listener of this.listeners) {
      listener.onTowerDeselected()
    }

    console.log(`🏗️ Tower deselected: ${previousTower.id}`)
  }

  private showHighlight(tower: Entity): void {
    if (!this.selectionHighlight) return

    const transform = tower.getComponent<Transform>('transform')
    const towerComponent = tower.getComponent<Tower>('tower')
    if (!transform || !towerComponent) return

    // ハイライトを描画
    this.selectionHighlight.clear()
    
    // 外側の円（アニメーション用）
    this.selectionHighlight.lineStyle(3, 0x00FF00, 0.8)
    this.selectionHighlight.drawCircle(0, 0, 35)
    
    // 内側の円
    this.selectionHighlight.lineStyle(2, 0x00FF00, 0.5)
    this.selectionHighlight.drawCircle(0, 0, 30)
    
    // 射程範囲の表示
    this.selectionHighlight.lineStyle(1, 0x00FF00, 0.3)
    this.selectionHighlight.beginFill(0x00FF00, 0.1)
    this.selectionHighlight.drawCircle(0, 0, towerComponent.getRange())
    this.selectionHighlight.endFill()

    // タワーに追加
    tower.container.addChild(this.selectionHighlight)
    this.selectionHighlight.visible = true
  }

  private hideHighlight(): void {
    if (!this.selectionHighlight) return

    if (this.selectionHighlight.parent) {
      this.selectionHighlight.parent.removeChild(this.selectionHighlight)
    }
    this.selectionHighlight.visible = false
  }

  private updateHighlight(): void {
    if (!this.selectionHighlight || !this.selectedTower) return

    // パルスアニメーション
    const time = Date.now() / 1000
    const scale = 1 + Math.sin(time * 3) * 0.05
    this.selectionHighlight.scale.set(scale)
    
    // 回転アニメーション（外側の円）
    this.selectionHighlight.rotation = time * 0.5
  }

  public addListener(listener: TowerSelectionListener): void {
    this.listeners.push(listener)
  }

  public removeListener(listener: TowerSelectionListener): void {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) {
      this.listeners.splice(index, 1)
    }
  }

  public getSelectedTower(): Entity | null {
    return this.selectedTower
  }

  public getSelectionHighlight(): PIXI.Graphics | null {
    return this.selectionHighlight
  }

  public destroy(): void {
    this.deselectTower()
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy()
    }
    this.listeners = []
  }
}