# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔨 最重要ルール - 新しいルールの追加プロセス

ユーザーから今回限りではなく常に対応が必要だと思われる指示を受けた場合：

1. 「これを標準のルールにしますか？」と質問する
2. YESの回答を得た場合、CLAUDE.mdに追加ルールとして記載する
3. 以降は標準ルールとして常に適用する

## 重要ルール

このプロジェクトではドキュメント、返信などはすべて日本語で行います

### TODO管理システム統合ルール
開発進捗の正確な追跡と将来のClaude Codeインスタンス向け情報共有のため、以下を厳守：

#### TodoWriteツール使用時の必須手順
1. **タスク開始時**: TodoWrite tool使用で該当タスクを`in_progress`に変更
2. **タスク完了時**: 即座に該当タスクを`completed`に変更
3. **新機能発見時**: 必要に応じて新しいタスクを追加
4. **一度に一つのタスクのみ**: `in_progress`状態は同時に1つまで

#### TODO_LIST.md同期更新の必須手順
5. **重要タスク完了時**: TODO_LIST.mdの該当セクションも同時更新
6. **新機能実装時**: TODO_LIST.mdに詳細実装内容を記録
7. **マイルストーン達成時**: 進捗セクション・完了済みセクションを更新
8. **フェーズ移行時**: 次のマイルストーンセクションを調整

#### 整合性チェック
- **週次**: TodoWriteツールとTODO_LIST.mdの状況一致確認
- **タスク変更時**: 両方のシステムへの反映確認
- **セッション開始時**: 前回からの変更点整合性確認

この二重管理により開発進捗を正確に追跡し、将来のClaude Codeインスタンスが現在の開発状況を即座に把握できる

## プロジェクト概要

タワーディフェンスゲーム - 戦略的多様タワーシステム
- 技術スタック：TypeScript + PixiJS + Vite + ECS
- **現在の状況**: 完全に機能するゲーム（ライフシステム・ゲーム速度制御・経済システム・マップエディター完備）
- **主要特徴**: 1000発同時ミサイル処理・80%+最適化・5種類タワー・5種類敵・完全なUI分離

## 開発コマンド

- `npm install` - 依存関係のインストール
- `npm run dev` - 開発サーバー起動（localhost:3000）
- `npm run build` - プロダクションビルド（TypeScript + Vite）
- `npm run preview` - ビルド後のプレビュー
- `npm run lint` - ESLintによるコード品質チェック
- `npm run lint:fix` - ESLintによる自動修正
- `npm run type-check` - TypeScriptの型チェックのみ実行

## 🏗️ 高レベルアーキテクチャ

### Entity Component System (ECS) パターン
このプロジェクトは厳密なECSアーキテクチャを採用しており、以下の原則に従う：

- **Entity**: IDとコンテナを持つデータコンテナ（`entities/Entity.ts`）
- **Component**: 再利用可能な機能単位（`entities/components/`）
- **System**: 特定のコンポーネントを持つエンティティを処理（`systems/`）

### 重要なアーキテクチャ決定

#### パフォーマンス最適化の三本柱
1. **オブジェクトプール** (`utils/pools/`): ガベージコレクション回避・最大3000発ミサイル対応
2. **空間分割衝突判定** (`utils/spatial/SpatialHash.ts`): 80%+の計算量削減
3. **描画バッチング** (`rendering/BatchRenderer.ts`): Graphics→Sprite自動変換（タワー除外）

#### UI分離アーキテクチャ
- **プレイヤーUI** (`ui/GameHUD.ts`, `ui/TowerPurchaseUI.ts`, `ui/PlayerUI.ts`): ゲームプレイ専用
- **デバッグUI** (`ui/DebugUIManager.ts`): 開発・テスト専用（Ctrl+D）
- **管理UI** (`ui/EconomyUI.ts`, `ui/MapEditorUI.ts`): 高度な機能（Ctrl+E/M）

#### ゲームシステム統合
`Game.ts`が全システムを統合し、以下の順序で更新：
1. InputSystem → 2. EconomySystem → 3. GameSystem → 4. PhysicsSystem → 5. RenderSystem

### データフロー
```
User Input → InputSystem → GameSystem → EntityManager → Components → Systems → Rendering
```

## 🎮 実装完了機能

### コアゲームシステム
- ✅ **5種類タワーシステム**: 戦略的多様性・アップグレード・統計追跡
- ✅ **5種類敵システム**: 耐性・特殊能力・ボスウェーブ（5ウェーブごと）
- ✅ **ライフシステム**: 敵ゴール到達でライフ減少・ゲームオーバー処理
- ✅ **ウェーブシステム**: 段階的難易度・準備期間・自動/手動進行
- ✅ **ゲーム速度制御**: 0-3倍速リアルタイム変更・キーボード対応

### 高度システム
- ✅ **経済システム**: 多通貨（ゴールド/クリスタル/研究/エネルギー）・投資・アップグレード
- ✅ **マップエディター**: グリッドベース視覚的編集・検証機能
- ✅ **プレイヤーUI分離**: デバッグ機能との完全分離
- ✅ **パーティクルエフェクト**: 1000パーティクル対応・爆発・火花
- ✅ **チュートリアルシステム**: 9ステップ包括的ガイド・ゲーム一時停止・進行保存・復元
- ✅ **設定システム**: 音量・グラフィック・言語・FPS表示・LocalStorage永続化

## 🧪 重要なデバッグコマンド

```javascript
// ブラウザコンソールで実行可能
game.testMassiveMissileBarrage(1000)     // 大量ミサイルテスト
game.benchmarkCollisionSystem(500)      // 空間分割効果測定
game.showPerformanceReport()            // 詳細パフォーマンス報告
game.forceStartNextWave()                // 次ウェーブ強制開始
game.showEconomyStats()                  // 経済統計表示
```

## 🚀 次の開発課題

### 高優先度（基本機能として必須）
- ✅ **チュートリアルシステム**（9ステップ包括的ガイド・一時停止・進行保存） **完了済み**
- ✅ **設定画面**（音量・グラフィック・言語・LocalStorage保存） **完了済み**
- 🎯 **勝利条件システム**（ステージクリア・達成感） **次の最優先タスク**
- 📁 **セーブ/ロード機能**（ゲーム進行保存・復元） **第2優先タスク**
- 🏠 **メインメニューシステム**（ゲーム開始・設定・終了） **第3優先タスク**

### 現在の開発戦略
- **フェーズ1**: ゲームサイクル完成（勝利条件→セーブ/ロード）を優先
- **フェーズ2**: メニューシステム実装（基本機能完成後）
- **理由**: プレイヤー体験向上とゲーム完成度を重視

## 技術的な決定事項

- **TypeScript**: 型安全性とコード品質向上のため
- **PixiJS**: 高パフォーマンス2Dレンダリング（1000発同時ミサイル要件）
- **Vite**: 高速開発・ビルド（ECSシステムの複雑性に対応）
- **ECS**: 大量オブジェクト管理の効率化（スケーラビリティ確保）
- **UI分離**: プレイヤー向けとデバッグ機能の明確な分離（UX向上）

# important-instruction-reminders
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.