export type CellType = 'empty' | 'path' | 'tower_zone' | 'start' | 'end' | 'obstacle'

export interface MapCell {
  x: number
  y: number
  type: CellType
  pathIndex?: number  // パスの順序（pathタイプの場合）
  metadata?: Record<string, any>  // 追加データ用
}

export interface PathPoint {
  x: number
  y: number
  cellX: number
  cellY: number
}

export interface MapConfig {
  id: string
  name: string
  description: string
  width: number  // グリッド幅
  height: number  // グリッド高さ
  cellSize: number  // 1セルのピクセルサイズ
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  maxTowers: number
  estimatedPlayTime: number  // 分
  author: string
  version: string
  createdAt: number
  updatedAt: number
}

export interface MapData {
  config: MapConfig
  cells: MapCell[][]
  pathPoints: PathPoint[]
  startPosition: { x: number, y: number }
  endPosition: { x: number, y: number }
  towerZones: { x: number, y: number }[]
  spawnSettings: {
    initialDelay: number
    spawnInterval: number
    maxConcurrentEnemies: number
  }
  waveSettings: {
    maxWaves: number
    difficultyScaling: number
    bossWaveInterval: number
  }
  economySettings: {
    startingMoney: number
    enemyRewardMultiplier: number
    waveRewardMultiplier: number
  }
}

/**
 * マップデータのユーティリティクラス
 */
export class MapDataUtils {
  /**
   * 新しいマップデータを作成
   */
  public static createEmptyMap(width: number, height: number, cellSize: number = 32): MapData {
    const id = `map_${Date.now()}`
    
    // 空のセル配列を作成
    const cells: MapCell[][] = []
    for (let y = 0; y < height; y++) {
      cells[y] = []
      for (let x = 0; x < width; x++) {
        cells[y][x] = {
          x,
          y,
          type: 'empty'
        }
      }
    }

    const config: MapConfig = {
      id,
      name: '新しいマップ',
      description: 'マップエディターで作成されたマップ',
      width,
      height,
      cellSize,
      difficulty: 'medium',
      maxTowers: 10,
      estimatedPlayTime: 5,
      author: 'Player',
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    return {
      config,
      cells,
      pathPoints: [],
      startPosition: { x: 0, y: Math.floor(height / 2) },
      endPosition: { x: width - 1, y: Math.floor(height / 2) },
      towerZones: [],
      spawnSettings: {
        initialDelay: 2,
        spawnInterval: 1,
        maxConcurrentEnemies: 10
      },
      waveSettings: {
        maxWaves: 20,
        difficultyScaling: 1.15,
        bossWaveInterval: 5
      },
      economySettings: {
        startingMoney: 200,
        enemyRewardMultiplier: 1.0,
        waveRewardMultiplier: 1.0
      }
    }
  }

  /**
   * セルをワールド座標に変換
   */
  public static cellToWorld(cellX: number, cellY: number, cellSize: number): { x: number, y: number } {
    return {
      x: cellX * cellSize + cellSize / 2,
      y: cellY * cellSize + cellSize / 2
    }
  }

  /**
   * ワールド座標をセルに変換
   */
  public static worldToCell(worldX: number, worldY: number, cellSize: number): { x: number, y: number } {
    return {
      x: Math.floor(worldX / cellSize),
      y: Math.floor(worldY / cellSize)
    }
  }

  /**
   * パスの自動生成（開始点から終了点への直線パス）
   */
  public static generateStraightPath(mapData: MapData): PathPoint[] {
    const { config, startPosition, endPosition } = mapData
    const path: PathPoint[] = []

    // 直線パスを生成
    const dx = endPosition.x - startPosition.x
    const dy = endPosition.y - startPosition.y
    const steps = Math.max(Math.abs(dx), Math.abs(dy))

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps
      const cellX = Math.round(startPosition.x + dx * t)
      const cellY = Math.round(startPosition.y + dy * t)
      
      const worldPos = this.cellToWorld(cellX, cellY, config.cellSize)
      
      path.push({
        x: worldPos.x,
        y: worldPos.y,
        cellX,
        cellY
      })

      // セルタイプを更新
      if (mapData.cells[cellY] && mapData.cells[cellY][cellX]) {
        if (i === 0) {
          mapData.cells[cellY][cellX].type = 'start'
        } else if (i === steps) {
          mapData.cells[cellY][cellX].type = 'end'
        } else {
          mapData.cells[cellY][cellX].type = 'path'
        }
        mapData.cells[cellY][cellX].pathIndex = i
      }
    }

    return path
  }

  /**
   * パスが有効かチェック
   */
  public static validatePath(mapData: MapData): { valid: boolean, issues: string[] } {
    const issues: string[] = []

    // 開始点と終了点の存在チェック
    const hasStart = mapData.cells.some(row => row.some(cell => cell.type === 'start'))
    const hasEnd = mapData.cells.some(row => row.some(cell => cell.type === 'end'))

    if (!hasStart) {
      issues.push('開始点が設定されていません')
    }
    if (!hasEnd) {
      issues.push('終了点が設定されていません')
    }

    // パスの連続性チェック
    if (mapData.pathPoints.length < 2) {
      issues.push('パスが短すぎます（最低2点必要）')
    }

    // パス間の距離チェック
    for (let i = 1; i < mapData.pathPoints.length; i++) {
      const prev = mapData.pathPoints[i - 1]
      const curr = mapData.pathPoints[i]
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      )
      
      if (distance > mapData.config.cellSize * 2) {
        issues.push(`パスポイント${i}と${i-1}の距離が長すぎます`)
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * タワー配置可能エリアの自動生成
   */
  public static generateTowerZones(mapData: MapData): void {
    const { config, cells } = mapData
    mapData.towerZones = []

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = cells[y][x]
        
        // パス、開始点、終了点、障害物でなければタワーゾーンに追加
        if (cell.type === 'empty') {
          // パスから最低1セル離れているかチェック
          const nearPath = this.isNearPath(x, y, cells, config.width, config.height)
          
          if (!nearPath) {
            cells[y][x].type = 'tower_zone'
            mapData.towerZones.push({ x, y })
          }
        }
      }
    }
  }

  /**
   * 指定した座標がパスの近くにあるかチェック
   */
  private static isNearPath(
    x: number, 
    y: number, 
    cells: MapCell[][], 
    width: number, 
    height: number
  ): boolean {
    // 周囲8方向をチェック
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborType = cells[ny][nx].type
          if (neighborType === 'path' || neighborType === 'start' || neighborType === 'end') {
            return true
          }
        }
      }
    }
    
    return false
  }

  /**
   * マップデータの検証
   */
  public static validateMapData(mapData: MapData): { valid: boolean, issues: string[] } {
    const issues: string[] = []

    // 基本設定の検証
    if (!mapData.config.name.trim()) {
      issues.push('マップ名が設定されていません')
    }

    if (mapData.config.width < 5 || mapData.config.height < 5) {
      issues.push('マップサイズが小さすぎます（最低5x5）')
    }

    if (mapData.config.maxTowers < 1) {
      issues.push('最大タワー数は1以上である必要があります')
    }

    // パスの検証
    const pathValidation = this.validatePath(mapData)
    issues.push(...pathValidation.issues)

    // タワーゾーンの検証
    if (mapData.towerZones.length === 0) {
      issues.push('タワー配置可能エリアがありません')
    }

    if (mapData.towerZones.length < mapData.config.maxTowers) {
      issues.push('タワー配置可能エリアが最大タワー数より少ないです')
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * マップデータをJSONに変換
   */
  public static toJSON(mapData: MapData): string {
    const exportData = {
      ...mapData,
      config: {
        ...mapData.config,
        updatedAt: Date.now()
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * JSONからマップデータを読み込み
   */
  public static fromJSON(json: string): MapData {
    try {
      const data = JSON.parse(json) as MapData
      
      // データの基本検証
      if (!data.config || !data.cells || !Array.isArray(data.pathPoints)) {
        throw new Error('無効なマップデータ形式')
      }

      return data
    } catch (error) {
      throw new Error(`マップデータの読み込みに失敗: ${error}`)
    }
  }

  /**
   * マップのプレビュー情報を生成
   */
  public static generatePreview(mapData: MapData) {
    const { config, pathPoints, towerZones } = mapData
    const validation = this.validateMapData(mapData)

    return {
      name: config.name,
      description: config.description,
      difficulty: config.difficulty,
      size: `${config.width}x${config.height}`,
      maxTowers: config.maxTowers,
      pathLength: pathPoints.length,
      towerZones: towerZones.length,
      estimatedPlayTime: `${config.estimatedPlayTime}分`,
      author: config.author,
      version: config.version,
      valid: validation.valid,
      issues: validation.issues,
      createdAt: new Date(config.createdAt).toLocaleDateString(),
      updatedAt: new Date(config.updatedAt).toLocaleDateString()
    }
  }

  /**
   * デフォルトマップコレクション
   */
  public static getDefaultMaps(): MapData[] {
    // シンプルな直線マップ
    const straightMap = this.createEmptyMap(15, 10, 32)
    straightMap.config.name = 'ストレートライン'
    straightMap.config.description = '敵が左から右へ直進するシンプルなマップ'
    straightMap.config.difficulty = 'easy'
    straightMap.config.maxTowers = 6
    straightMap.pathPoints = this.generateStraightPath(straightMap)
    this.generateTowerZones(straightMap)

    // L字型マップ
    const lShapeMap = this.createEmptyMap(12, 12, 32)
    lShapeMap.config.name = 'L字コース'
    lShapeMap.config.description = 'L字型のパスで戦略性が要求されるマップ'
    lShapeMap.config.difficulty = 'medium'
    lShapeMap.config.maxTowers = 8
    lShapeMap.startPosition = { x: 0, y: 0 }
    lShapeMap.endPosition = { x: 11, y: 11 }
    // L字パスを手動で定義（より複雑なパス生成は後で実装）
    lShapeMap.pathPoints = this.generateStraightPath(lShapeMap)
    this.generateTowerZones(lShapeMap)

    return [straightMap, lShapeMap]
  }
}