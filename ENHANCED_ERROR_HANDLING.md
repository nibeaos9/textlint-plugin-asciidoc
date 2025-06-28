# Enhanced Error Handling - エラーハンドリング強化

## 概要

`AsciidocProcessor.ts` にエラーハンドリングと多言語対応の機能を追加しました。

## 新機能

### 1. エラーレベル定義
```typescript
export enum ErrorLevel {
  FATAL = "fatal",      // 致命的エラー（処理停止）
  WARNING = "warning",  // 警告（処理継続）
  INFO = "info"        // 情報（推奨事項）
}
```

### 2. 詳細エラー情報
```typescript
export interface AsciidocError {
  level: ErrorLevel;
  message: string;
  messageJa?: string;   // 日本語メッセージ（オプション）
  line?: number;        // エラー発生行
  column?: number;      // エラー発生列
  source?: string;      // ソースファイルパス
  suggestion?: string;  // 修正提案
}
```

### 3. 拡張オプション
```typescript
export interface AsciidocProcessorOptions extends TextlintPluginOptions {
  locale?: "en" | "ja";          // 言語設定
  strictMode?: boolean;          // 厳密モード
  includeWarnings?: boolean;     // 警告表示の有無
}
```

## 使用例

### 基本的な使用方法
```javascript
const processor = new AsciidocProcessor({
  locale: "ja",              // 日本語メッセージ
  strictMode: false,         // 非厳密モード
  includeWarnings: true      // 警告表示あり
});
```

### 厳密モードでの使用
```javascript
const processor = new AsciidocProcessor({
  locale: "en",
  strictMode: true,          // エラー時に例外を投げる
  includeWarnings: true
});
```

## エラーメッセージ対応

### 英語メッセージ
- `parseError`: "AsciiDoc parsing failed: {details}"
- `syntaxError`: "Syntax error at line {line}: {message}"
- `includeError`: "Include file error: {message}"
- `attributeError`: "Attribute error: {message}"

### 日本語メッセージ
- `parseError`: "AsciiDoc解析エラー: {details}"
- `syntaxError`: "{line}行目で構文エラー: {message}"
- `includeError`: "インクルードファイルエラー: {message}"
- `attributeError`: "属性エラー: {message}"

## エラー処理の流れ

1. **パース実行**: `parse(text)` を試行
2. **エラー発生**: 例外をキャッチして詳細情報を解析
3. **モード判定**: 
   - `strictMode: true` → 例外を再スロー
   - `strictMode: false` → 警告出力して空のASTを返す
4. **警告制御**: `includeWarnings` の設定に応じて警告表示

## テスト結果

✅ **全テスト成功**: 40/40 passed  
✅ **カバレッジ**: 96.42% (ブランチカバレッジ)  
✅ **ビルド**: エラーなし

## 将来の拡張

- より詳細なエラー分類
- 修正提案の自動生成
- カスタムエラーハンドラーの対応
- パフォーマンス監視機能
