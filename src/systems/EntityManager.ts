import { Entity } from '@/entities/Entity'

export class EntityManager {
  private entities: Map<string, Entity> = new Map()
  private entitiesToRemove: Set<string> = new Set()
  private nextId = 1

  public createEntity(type: string): Entity {
    const id = `${type}_${this.nextId++}`
    const entity = new Entity(id, type)
    this.entities.set(id, entity)
    return entity
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id)
  }

  public getEntities(): Entity[] {
    return Array.from(this.entities.values())
  }
  
  /**
   * 既存のエンティティをEntityManagerに登録（プール用）
   */
  public addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity)
    console.log(`📦 Added existing entity ${entity.id} to EntityManager`)
  }

  public getEntitiesByType(type: string): Entity[] {
    return this.getEntities().filter(entity => entity.type === type)
  }

  public removeEntity(id: string): void {
    this.entitiesToRemove.add(id)
  }

  public cleanup(): void {
    for (const id of this.entitiesToRemove) {
      const entity = this.entities.get(id)
      if (entity) {
        entity.destroy()
        this.entities.delete(id)
      }
    }
    this.entitiesToRemove.clear()
  }

  public getEntityCount(): number {
    return this.entities.size
  }

  public clear(): void {
    for (const entity of this.entities.values()) {
      entity.destroy()
    }
    this.entities.clear()
    this.entitiesToRemove.clear()
  }
}