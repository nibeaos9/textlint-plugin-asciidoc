/* eslint-disable no-unused-vars */
// LICENSE : MIT
"use strict";
import { parse } from "./asciidoc-to-ast";
import type { TextlintPluginOptions } from "@textlint/types";

// エラーレベルの定義
export enum ErrorLevel {
  FATAL = "fatal",
  WARNING = "warning", 
  INFO = "info"
}

// エラー情報の型定義
export interface AsciidocError {
  level: ErrorLevel;
  message: string;
  messageJa?: string;
  line?: number;
  column?: number;
  source?: string;
  suggestion?: string;
}

// プロセッサオプションの拡張
export interface AsciidocProcessorOptions extends TextlintPluginOptions {
  locale?: "en" | "ja";
  strictMode?: boolean;
  includeWarnings?: boolean;
}

export class AsciidocProcessor {
  config: AsciidocProcessorOptions;
  extensions: Array<string>;
  private locale: "en" | "ja";
  private strictMode: boolean;
  private includeWarnings: boolean; // 将来の警告機能用

  constructor(config?: AsciidocProcessorOptions | null) {
      this.config = config || {};
      this.extensions = this.config.extensions ? this.config.extensions : [];
      this.locale = this.config.locale || "en";
      this.strictMode = this.config.strictMode || false;
      this.includeWarnings = this.config.includeWarnings || true;
  }

  // エラーメッセージの多言語対応
  private getErrorMessage(key: string, details?: any): string {
    const messages: Record<string, Record<string, string>> = {
      en: {
        parseError: `AsciiDoc parsing failed: ${details?.message || 'Unknown error'}`,
        syntaxError: `Syntax error at line ${details?.line || '?'}: ${details?.message || 'Invalid syntax'}`,
        includeError: `Include file error: ${details?.message || 'File not found'}`,
        attributeError: `Attribute error: ${details?.message || 'Invalid attribute'}`,
        unknownError: `Unexpected error occurred during processing: ${details?.message || 'Unknown'}`,
        deprecatedSyntax: `Deprecated syntax found: ${details?.message || 'Consider updating'}`,
        missingAttribute: `Missing required attribute: ${details?.attribute || 'unknown'}`
      },
      ja: {
        parseError: `AsciiDoc解析エラー: ${details?.message || '不明なエラー'}`,
        syntaxError: `${details?.line || '?'}行目で構文エラー: ${details?.message || '無効な構文'}`,
        includeError: `インクルードファイルエラー: ${details?.message || 'ファイルが見つかりません'}`,
        attributeError: `属性エラー: ${details?.message || '無効な属性'}`,
        unknownError: `処理中に予期しないエラーが発生しました: ${details?.message || '不明'}`,
        deprecatedSyntax: `非推奨の構文が見つかりました: ${details?.message || '更新を検討してください'}`,
        missingAttribute: `必須属性が不足しています: ${details?.attribute || '不明'}`
      }
    };
    
    return messages[this.locale]?.[key] || messages.en?.[key] || key;
  }

  // エラー情報の生成
  private createError(level: ErrorLevel, messageKey: string, details?: any): AsciidocError {
    const message = this.getErrorMessage(messageKey, details);
    const messageJa = this.locale === "ja" ? undefined : this.getErrorMessage(messageKey, details);
    
    return {
      level,
      message,
      messageJa,
      line: details?.line,
      column: details?.column,
      source: details?.source,
      suggestion: details?.suggestion
    };
  }

  availableExtensions() {
    // 重複拡張子を除去
    const baseExtensions = [".adoc", ".asciidoc", ".asc"];
    return [...new Set([...baseExtensions, ...this.extensions])];
  }

  processor(_ext: string) {
    return {
      preProcess: (text: string, filePath?: string) => {
        try {
          return parse(text);
        } catch (error: any) {
          const errorDetails = this.parseErrorDetails(error, text, filePath);
          const asciidocError = this.createError(ErrorLevel.FATAL, 'parseError', errorDetails);
          
          if (this.strictMode) {
            throw new Error(asciidocError.message);
          }
          
          // 非strictモードでは警告として処理し、空のASTを返す
          if (this.includeWarnings) {
            console.warn(asciidocError.message);
          }
          return this.createEmptyAst();
        }
      },
      postProcess: (messages: any[], filePath?: string) => {
        return {
          messages,
          filePath: filePath || "<asciidoc>"
        };
      }
    };
  }

  // エラー詳細情報の解析
  private parseErrorDetails(error: any, text: string, filePath?: string) {
    const lines = text.split('\n');
    
    // エラーメッセージから行番号を抽出
    const lineMatch = error.message?.match(/line (\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
    
    return {
      message: error.message,
      line,
      source: filePath,
      context: line && lines[line - 1] ? lines[line - 1].trim() : undefined
    };
  }

  // 空のASTノードを作成（パースエラー時のフォールバック）
  private createEmptyAst() {
    return {
      type: "Document",
      children: [],
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 0 }
      },
      range: [0, 0],
      raw: ""
    };
  }
}
