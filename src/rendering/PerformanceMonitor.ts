/**
 * パフォーマンス監視システム
 * FPS、描画コール数、メモリ使用量などを監視
 */
export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 0
  private avgFps = 0
  private fpsHistory: number[] = []
  private maxHistorySize = 60

  private drawCalls = 0
  private entityCount = 0
  private particleCount = 0
  
  private isMonitoring = false
  private monitoringInterval: number | null = null

  constructor() {
    this.startMonitoring()
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    
    // FPS計算のフレームカウンター
    const updateFPS = () => {
      if (!this.isMonitoring) return
      
      this.frameCount++
      const currentTime = performance.now()
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
        this.updateFpsHistory(this.fps)
        this.frameCount = 0
        this.lastTime = currentTime
      }
      
      requestAnimationFrame(updateFPS)
    }
    updateFPS()
    
    console.log('📊 PerformanceMonitor: Monitoring started')
  }

  public stopMonitoring(): void {
    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    console.log('📊 PerformanceMonitor: Monitoring stopped')
  }

  private updateFpsHistory(fps: number): void {
    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift()
    }
    
    // 平均FPS計算
    this.avgFps = Math.round(
      this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
    )
  }

  public updateEntityCount(entities: number): void {
    this.entityCount = entities
  }

  public updateParticleCount(particles: number): void {
    this.particleCount = particles
  }

  public updateDrawCalls(calls: number): void {
    this.drawCalls = calls
  }

  public getFPS(): number {
    return this.fps
  }

  public getAverageFPS(): number {
    return this.avgFps
  }

  public getStats() {
    const memoryInfo = (performance as any).memory
    
    return {
      fps: {
        current: this.fps,
        average: this.avgFps,
        min: Math.min(...this.fpsHistory),
        max: Math.max(...this.fpsHistory),
        history: [...this.fpsHistory]
      },
      rendering: {
        drawCalls: this.drawCalls,
        entities: this.entityCount,
        particles: this.particleCount
      },
      memory: memoryInfo ? {
        used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      performance: {
        isMonitoring: this.isMonitoring,
        sampleSize: this.fpsHistory.length
      }
    }
  }

  public getPerformanceGrade(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (this.avgFps >= 55) return 'excellent'
    if (this.avgFps >= 45) return 'good'
    if (this.avgFps >= 30) return 'fair'
    return 'poor'
  }

  public logPerformanceReport(): void {
    const stats = this.getStats()
    const grade = this.getPerformanceGrade()
    
    console.log('📊 Performance Report:')
    console.log(`  📈 FPS: ${stats.fps.current} (avg: ${stats.fps.average})`)
    console.log(`  🎯 Grade: ${grade.toUpperCase()}`)
    console.log(`  🎨 Draw Calls: ${stats.rendering.drawCalls}`)
    console.log(`  📦 Entities: ${stats.rendering.entities}`)
    console.log(`  ✨ Particles: ${stats.rendering.particles}`)
    
    if (stats.memory) {
      console.log(`  💾 Memory: ${stats.memory.used}MB / ${stats.memory.total}MB`)
    }
    
    // パフォーマンス改善提案
    if (grade === 'poor' || grade === 'fair') {
      console.log('⚠️ Performance Suggestions:')
      
      if (stats.rendering.entities > 200) {
        console.log('  - Consider implementing object pooling')
      }
      
      if (stats.rendering.particles > 500) {
        console.log('  - Reduce particle count or implement particle pooling')
      }
      
      if (stats.fps.current < 30) {
        console.log('  - Enable sprite batching for better performance')
      }
      
      if (stats.memory && stats.memory.used > 100) {
        console.log('  - Monitor memory usage for potential leaks')
      }
    }
  }

  public destroy(): void {
    this.stopMonitoring()
    this.fpsHistory = []
    console.log('🗑️ PerformanceMonitor destroyed')
  }
}