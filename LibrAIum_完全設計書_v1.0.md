# LibrAIum 完全設計書 v1.0

**個人向けベストプラクティス GitHub リポジトリ管理システム**  
**LibrAIum（ライブラリアム）**

**バージョン**: 1.0（完全版）  
**日付**: 2026-07-08  
**ステータス**: 設計完了

---

## 1. システム概要

**LibrAIum** は、Webアプリ、ゲーム、音声認識、動画編集、アフィリエイト、AIエージェント開発など、**さまざまなジャンルにおけるベストプラクティスな GitHub パブリックリポジトリ** を、個人で厳選・管理・活用するためのローカルGUIシステムです。

### 核心コンセプト
- **神話的大図書館 × AI技術**: 「LibrAIum」という造語で、神話的な知識の宝庫と現代のAI技術を融合。
- **個人専用・ローカルファースト**: 完全に個人で使う。データはローカルGitリポジトリで管理。
- **AIネイティブ**: システム自体が **MCPサーバー** として動作。Claude Codeから直接「最適なリポジトリを提案して」と自然言語で聞ける。
- **常に鮮度を保つ**: X APIによる自動収集 + GitHubメタデータ自動更新 + stale検知・代替提案。
- **Gitネイティブ**: すべてのデータをYAML frontmatter + Markdownで管理。Gitの全機能を活かしたバージョン管理・バックアップが可能。

### なぜ世界中のAI開発者が欲しくなるか
既存のawesome-listやグローバルレジストリは「探す」体験が中心です。  
LibrAIumは「**自分のベストプラクティスを一元管理し、AIに直接相談して新しいプロジェクトへ即適用できる**」パーソナル実行可能レジストリです。

特にAIエージェント開発者にとって、MCP経由でClaude Codeとシームレスに連携できる点が最大の強みです。

---

## 2. 正式名称とブランディング

**正式名称**: LibrAIum（ライブラリアム）

- **由来**: Librarium（知識の宝庫・大図書館） + AI
- **読み**: ライブラリアム
- **コンセプト**: 神話的大図書館の重厚感と、AI技術の先進性を併せ持つ造語。
- **ブランドメッセージ**: 「あなたの知見を、AIと一緒に育てるパーソナル図書館」

---

## 3. 機能要件

### 3.1 MVP（v1.0）で実現する機能

#### データ管理
- Gitリポジトリ内の `data/entries/<category>/` に1リポジトリ1ファイル（YAML frontmatter + Markdown）
- GUIから追加・編集・削除
- GitHub公開APIによるメタデータ自動取得（stars, last_push, languageなど）
- 全件一括リフレッシュ機能

#### GUI
- モダンなデスクトップアプリケーション（Tauri推奨）
- サイドバー: カテゴリ一覧 + タグクラウド + ステータスフィルタ
- メイン検索: 即時fuzzy検索 + フィルタ
- 詳細ビュー: Personal Notes編集 + メタデータ + アクション
- 設定画面: カテゴリマスタ管理（追加・編集・削除・並び替え）
- Gitパネル: 変更確認・コミット・プッシュ

#### カテゴリマスタ管理
- `data/master/categories.yaml` で管理
- GUIで自由にカテゴリを追加・編集・削除可能
- 色・アイコン・説明・並び順をカスタマイズ可能

#### MCPサーバー機能（最重要差別化）
システム起動時にローカルMCPサーバーを起動し、Claude Codeから直接利用可能。

**提供ツール**:
- `search_repos`（条件検索）
- `get_repo_details`
- `suggest_for_new_project`（プロジェクト説明を渡すと最適リポジトリ + 理由 + 導入手順を提案）
- `add_repo`（MCP経由での登録）

**使用例**:
> 「LibrAIumから、ベクトルDBとナレッジ管理を組み合わせたRAGエージェントに最適なリポジトリを3つ提案して。MCP追加コマンドも一緒に。」

#### その他MVP機能
- Personal Notesの豊富な編集（Markdown対応）
- 重複チェック
- エクスポート（awesome-list形式MD）

### 3.2 将来機能（v1.5以降）

- **X自動収集**: X APIで定期検索 → GitHub URL抽出 → 候補登録（要承認）
- **動的鮮度管理**: GitHubメタデータ自動更新 + staleフラグ + 代替候補提案
- **セマンティック検索**: ローカル埋め込みモデルによる意味検索
- **高度ブートストラップ**: 推薦に基づいたプロジェクト雛形生成
- **エージェント連携の深化**: より高度なMCPツール（例: 複数リポジトリの組み合わせ提案）

---

## 4. 非機能要件

- **完全ローカル完結**: 基本動作にインターネット不要（メタデータ更新・X収集時のみ）
- **プライバシー最優先**: データはローカルGitリポジトリのみ
- **パフォーマンス**: 数千エントリでも検索が高速
- **Git親和性**: 個別ファイル管理によりdiff/mergeが自然
- **拡張性**: カテゴリマスタにより新しいジャンルに柔軟対応
- **クロスプラットフォーム**: Windows / macOS / Linux対応

---

## 5. データモデルと保存形式

### 保存形式（確定）
- **エントリ**: `data/entries/<category>/<owner-repo>.md`
  - YAML frontmatter + Markdown本文
- **カテゴリマスタ**: `data/master/categories.yaml`
- **将来的**: embeddingsデータ（ローカルベクトル検索用）

### エントリ例（YAML frontmatter）

```yaml
---
github_url: https://github.com/owner/repo
full_name: owner/repo
category: ai-agent
tags: [vector-db, rag, mcp-server, claude-code]
stars: 8750
language: Python
last_github_push: 2026-07-05
last_checked: 2026-07-08
status: active
source: manual
added_date: 2026-06-20
---

# Repo Name

（要約やREADME抜粋）

## Personal Notes
- このプロジェクトで実際に使った経験と注意点
- 組み合わせが良かった他のリポジトリ
- 将来の活用アイデア
```

この形式により、**構造化データ**と**リッチな個人知見**を両立させ、Gitで美しく管理できます。

---

## 6. カテゴリ taxonomy（完全版）

### AI・エージェント系（特に強化）
- **ai-agent**（AIエージェント全般）
  - vector-db
  - knowledge-management
  - agent-loop-reasoning
  - multi-agent
  - mcp-server
  - agent-memory
  - agent-tooling
  - prompt-engineering
  - agent-evaluation
  - llm-infra
  - agent-deployment

### その他の主要カテゴリ
- web-app
- mobile-app
- desktop-app
- game-dev
- devops-infra
- data-science
- security
- blockchain-web3
- audio-voice
- video
- design-ui
- blog-content
- affiliate
- productivity
- education-edtech
- finance-trading
- open-source-tooling

カテゴリマスタにより、ユーザーがGUIで自由に拡張可能です。

---

## 7. アーキテクチャ

```
LibrAIum Desktop App (Tauri v2 + Svelte 5)
├── GUI Layer（検索・編集・カテゴリマスタ管理）
├── Data Layer（YAML frontmatter パース・検証）
├── Git Layer（libgit2 / git2-rs）
├── MCP Server（stdio / ローカルプロセス）
└── Background Tasks（X収集・メタデータ更新）

データ:
data/
├── entries/<category>/*.md
├── master/categories.yaml
└── embeddings/（将来）
```

---

## 8. GUI主要画面

1. **ダッシュボード** — 統計・stale一覧・最近追加
2. **検索・一覧** — 即時検索 + フィルタ + グリッド/リスト表示
3. **詳細・編集** — Personal Notes編集 + メタデータ + アクション
4. **カテゴリマスタ管理** — 追加・編集・削除・並び替え
5. **設定・Gitパネル** — データパス・Git操作・MCP設定

---

## 9. MCPツール詳細（Claude Code連携）

MVPで提供する主なツール:

- `search_repos(query, category?, tags?, min_stars?, status?)`
- `get_repo_details(id_or_url)`
- `suggest_for_new_project(project_description, goals, max_results=5)`
- `add_repo(github_url, category, tags, personal_notes?)`

これにより、Claude Code内で自然言語でLibrAIumを操作できます。

---

## 10. 将来機能の詳細

### X自動収集
- ユーザーが登録した検索クエリで定期実行
- GitHub URL抽出 → 関連性スコア算出 → 候補として登録（要承認）
- ソースとconfidenceを記録

### 動的鮮度管理
- 定期的にGitHubメタデータを更新
- `last_push` が古い場合は `status: stale` に自動変更
- 同じカテゴリ・タグでよりアクティブな代替を提案

---

## 11. 技術選定

**推奨スタック**:
- **デスクトップGUI**: Tauri v2（Rust） + Svelte 5
- **データ処理**: Rust（serde_yaml, git2-rs）
- **MCPサーバー**: RustまたはNode.js（stdio）
- **X API**: 公式API v2（安全なキー保存）
- **将来的なセマンティック検索**: ローカル埋め込みモデル（ONNX）

モダンで軽量、高性能、ネイティブな体験を提供します。

---

## 12. 実装ロードマップ（目安）

- **Phase 0**: 設計完了（本書）
- **Phase 1**: データ層 + カテゴリマスタ + 基本GUI + Git操作
- **Phase 2**: MCPサーバー基本ツール + suggest_for_new_project
- **Phase 3**: メタデータ自動更新 + stale検知 + Gitパネル完成
- **Phase 4**: X自動収集パイプライン + 候補レビューUI
- **Phase 5**: セマンティック検索 + 高度機能 + ドキュメント整備 + OSS公開（MIT）

---

## 13. セキュリティ・運用

- データはローカルGitリポジトリのみ
- X APIキー・GitHub PATはOSキーチェーンまたは暗号化保存
- MCPはstdio（ローカルプロセス）を推奨
- オープンソース化時はMITライセンスを推奨

---

## 14. 補遺

### 用語
- **MCP**: Model Context Protocol（Anthropicが推進するAIツール連携標準）
- **Personal Notes**: 各リポジトリに対するユーザーの実使用経験・注意点・組み合わせ例
- **カテゴリマスタ**: GUIで管理可能なカテゴリ一覧

---

**LibrAIum 完全設計書 v1.0 終了**

この設計書は、すべての議論を統合した完全版です。  
実装に必要な情報はほぼ網羅されています。

次のアクションが必要であれば、以下からお選びください：
- 実装計画書の作成
- 詳細なUI仕様書の作成
- プロトタイプ開発の開始計画

ご指示をお待ちしています。