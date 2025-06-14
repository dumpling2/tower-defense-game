interface GameSettings {
  masterVolume: number
  musicVolume: number
  soundVolume: number
  graphicsQuality: 'low' | 'medium' | 'high'
  showFPS: boolean
  enableParticles: boolean
  language: 'ja' | 'en'
}

export class SettingsMenu {
  private container: HTMLElement
  private onBack: () => void
  private settings: GameSettings

  constructor(onBack: () => void) {
    this.onBack = onBack
    this.settings = this.loadSettings()
    this.container = this.createSettingsHTML()
    this.setupEventListeners()
  }

  private loadSettings(): GameSettings {
    const saved = localStorage.getItem('tower-defense-settings')
    if (saved) {
      try {
        return { ...this.getDefaultSettings(), ...JSON.parse(saved) }
      } catch (error) {
        console.warn('設定の読み込みに失敗しました:', error)
      }
    }
    return this.getDefaultSettings()
  }

  private getDefaultSettings(): GameSettings {
    return {
      masterVolume: 70,
      musicVolume: 60,
      soundVolume: 80,
      graphicsQuality: 'high',
      showFPS: false,
      enableParticles: true,
      language: 'ja'
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('tower-defense-settings', JSON.stringify(this.settings))
      console.log('✅ 設定を保存しました')
    } catch (error) {
      console.error('❌ 設定の保存に失敗しました:', error)
    }
  }

  private createSettingsHTML(): HTMLElement {
    const settingsHTML = `
      <div id="settings-menu-overlay" class="settings-menu-overlay">
        <div class="settings-menu-content">
          <div class="settings-header">
            <h2>⚙️ 設定</h2>
            <button id="settings-back-btn" class="back-btn">
              <span>←</span>
              <span>戻る</span>
            </button>
          </div>
          
          <div class="settings-sections">
            <!-- 音量設定 -->
            <div class="settings-section">
              <h3>🔊 音量設定</h3>
              
              <div class="setting-item">
                <label for="master-volume">マスターボリューム</label>
                <div class="slider-container">
                  <input type="range" id="master-volume" min="0" max="100" value="${this.settings.masterVolume}">
                  <span class="slider-value">${this.settings.masterVolume}%</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label for="music-volume">BGM音量</label>
                <div class="slider-container">
                  <input type="range" id="music-volume" min="0" max="100" value="${this.settings.musicVolume}">
                  <span class="slider-value">${this.settings.musicVolume}%</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label for="sound-volume">効果音音量</label>
                <div class="slider-container">
                  <input type="range" id="sound-volume" min="0" max="100" value="${this.settings.soundVolume}">
                  <span class="slider-value">${this.settings.soundVolume}%</span>
                </div>
              </div>
            </div>
            
            <!-- グラフィック設定 -->
            <div class="settings-section">
              <h3>🎨 グラフィック設定</h3>
              
              <div class="setting-item">
                <label for="graphics-quality">グラフィック品質</label>
                <select id="graphics-quality">
                  <option value="low" ${this.settings.graphicsQuality === 'low' ? 'selected' : ''}>低</option>
                  <option value="medium" ${this.settings.graphicsQuality === 'medium' ? 'selected' : ''}>中</option>
                  <option value="high" ${this.settings.graphicsQuality === 'high' ? 'selected' : ''}>高</option>
                </select>
              </div>
              
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="show-fps" ${this.settings.showFPS ? 'checked' : ''}>
                  <span class="checkbox-custom"></span>
                  FPS表示
                </label>
              </div>
              
              <div class="setting-item">
                <label>
                  <input type="checkbox" id="enable-particles" ${this.settings.enableParticles ? 'checked' : ''}>
                  <span class="checkbox-custom"></span>
                  パーティクルエフェクト
                </label>
              </div>
            </div>
            
            <!-- ゲーム設定 -->
            <div class="settings-section">
              <h3>🎮 ゲーム設定</h3>
              
              <div class="setting-item">
                <label for="language">言語</label>
                <select id="language">
                  <option value="ja" ${this.settings.language === 'ja' ? 'selected' : ''}>日本語</option>
                  <option value="en" ${this.settings.language === 'en' ? 'selected' : ''}>English</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- 設定操作ボタン -->
          <div class="settings-actions">
            <button id="reset-settings-btn" class="action-btn secondary">
              <span>🔄</span>
              <span>デフォルトに戻す</span>
            </button>
            
            <button id="apply-settings-btn" class="action-btn primary">
              <span>✅</span>
              <span>適用して戻る</span>
            </button>
          </div>
        </div>
      </div>
    `

    const container = document.createElement('div')
    container.innerHTML = settingsHTML
    document.body.appendChild(container)
    
    return container
  }

  private setupEventListeners(): void {
    // 戻るボタン
    document.getElementById('settings-back-btn')?.addEventListener('click', () => {
      this.saveSettings()
      this.onBack()
    })

    // 適用ボタン
    document.getElementById('apply-settings-btn')?.addEventListener('click', () => {
      this.saveSettings()
      this.onBack()
    })

    // リセットボタン
    document.getElementById('reset-settings-btn')?.addEventListener('click', () => {
      if (confirm('設定をデフォルト値に戻しますか？')) {
        this.settings = this.getDefaultSettings()
        this.updateUI()
      }
    })

    // 音量スライダー
    this.setupVolumeSlider('master-volume', 'masterVolume')
    this.setupVolumeSlider('music-volume', 'musicVolume')
    this.setupVolumeSlider('sound-volume', 'soundVolume')

    // グラフィック品質
    document.getElementById('graphics-quality')?.addEventListener('change', (event) => {
      const select = event.target as HTMLSelectElement
      this.settings.graphicsQuality = select.value as 'low' | 'medium' | 'high'
    })

    // チェックボックス
    document.getElementById('show-fps')?.addEventListener('change', (event) => {
      const checkbox = event.target as HTMLInputElement
      this.settings.showFPS = checkbox.checked
    })

    document.getElementById('enable-particles')?.addEventListener('change', (event) => {
      const checkbox = event.target as HTMLInputElement
      this.settings.enableParticles = checkbox.checked
    })

    // 言語設定
    document.getElementById('language')?.addEventListener('change', (event) => {
      const select = event.target as HTMLSelectElement
      this.settings.language = select.value as 'ja' | 'en'
    })

    // ESCキーで戻る
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible()) {
        this.saveSettings()
        this.onBack()
      }
    })
  }

  private setupVolumeSlider(sliderId: string, settingKey: 'masterVolume' | 'musicVolume' | 'soundVolume'): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement
    const valueSpan = slider?.parentElement?.querySelector('.slider-value')
    
    if (slider && valueSpan) {
      slider.addEventListener('input', () => {
        const value = parseInt(slider.value)
        this.settings[settingKey] = value
        valueSpan.textContent = `${value}%`
      })
    }
  }

  private updateUI(): void {
    // 音量スライダーを更新
    this.updateSlider('master-volume', this.settings.masterVolume)
    this.updateSlider('music-volume', this.settings.musicVolume)
    this.updateSlider('sound-volume', this.settings.soundVolume)

    // グラフィック品質を更新
    const qualitySelect = document.getElementById('graphics-quality') as HTMLSelectElement
    if (qualitySelect) {
      qualitySelect.value = this.settings.graphicsQuality
    }

    // チェックボックスを更新
    const fpsCheckbox = document.getElementById('show-fps') as HTMLInputElement
    if (fpsCheckbox) {
      fpsCheckbox.checked = this.settings.showFPS
    }

    const particlesCheckbox = document.getElementById('enable-particles') as HTMLInputElement
    if (particlesCheckbox) {
      particlesCheckbox.checked = this.settings.enableParticles
    }

    // 言語を更新
    const languageSelect = document.getElementById('language') as HTMLSelectElement
    if (languageSelect) {
      languageSelect.value = this.settings.language
    }
  }

  private updateSlider(sliderId: string, value: number): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement
    const valueSpan = slider?.parentElement?.querySelector('.slider-value')
    
    if (slider && valueSpan) {
      slider.value = value.toString()
      valueSpan.textContent = `${value}%`
    }
  }

  public show(): void {
    const overlay = document.getElementById('settings-menu-overlay')
    if (overlay) {
      overlay.style.display = 'flex'
      setTimeout(() => {
        overlay.classList.add('fade-in')
      }, 10)
    }
  }

  public hide(): void {
    const overlay = document.getElementById('settings-menu-overlay')
    if (overlay) {
      overlay.classList.add('fade-out')
      setTimeout(() => {
        overlay.style.display = 'none'
        overlay.classList.remove('fade-in', 'fade-out')
      }, 300)
    }
  }

  public isVisible(): boolean {
    const overlay = document.getElementById('settings-menu-overlay')
    return overlay ? overlay.style.display !== 'none' : false
  }

  public getSettings(): GameSettings {
    return { ...this.settings }
  }

  public destroy(): void {
    this.container.remove()
  }
}