import { Container } from 'pixi.js'

export interface Component {
  update?(deltaTime: number): void
  destroy?(): void
}

export class Entity {
  public readonly id: string
  public readonly type: string
  public readonly container: Container
  private components: Map<string, Component> = new Map()
  protected isActive = true

  constructor(id: string, type: string) {
    this.id = id
    this.type = type
    this.container = new Container()
  }

  public addComponent<T extends Component>(name: string, component: T): T {
    this.components.set(name, component)
    return component
  }

  public getComponent<T extends Component>(name: string): T | undefined {
    return this.components.get(name) as T | undefined
  }

  public hasComponent(name: string): boolean {
    return this.components.has(name)
  }

  public removeComponent(name: string): void {
    const component = this.components.get(name)
    if (component?.destroy) {
      component.destroy()
    }
    this.components.delete(name)
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return

    for (const component of this.components.values()) {
      if (component.update) {
        component.update(deltaTime)
      }
    }
  }

  public setActive(active: boolean): void {
    this.isActive = active
    this.container.visible = active
  }

  public isEntityActive(): boolean {
    return this.isActive
  }

  public destroy(): void {
    for (const component of this.components.values()) {
      if (component.destroy) {
        component.destroy()
      }
    }
    this.components.clear()
    this.container.destroy()
  }
}