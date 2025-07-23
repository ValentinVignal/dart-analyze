import { describe, it, expect } from 'vitest';
import { AnalyzeResult, type AnalyzeResultLine } from './AnalyzeResult.js';
import { FailOnEnum } from '../utils/FailOn.js';
import type { ParsedLine } from './ParsedLine.js';
import type { ModifiedFile } from '../utils/ModifiedFiles.js';
import { DartAnalyzeLogTypeEnum } from './DartAnalyzeLogType.js';

const makeOptions = (failOn: number, emojis = false) =>
  ({ failOn, emojis }) as any;

describe('AnalyzeResult', () => {
  it('should be successful if failCount is 0', () => {
    const result = new AnalyzeResult(
      { counts: { errors: 0, warnings: 0, info: 0 }, lines: [] },
      makeOptions(FailOnEnum.Nothing),
    );
    expect(result.success).toBe(true);
  });

  it('should not be successful if failCount is nonzero', () => {
    const result = new AnalyzeResult(
      { counts: { errors: 1, warnings: 0, info: 0 }, lines: [] },
      makeOptions(FailOnEnum.Error),
    );
    expect(result.success).toBe(false);
  });

  it('hasWarning is true if any logs', () => {
    const result = new AnalyzeResult(
      { counts: { errors: 0, warnings: 1, info: 0 }, lines: [] },
      makeOptions(FailOnEnum.Warning),
    );
    expect(result.hasWarning).toBe(true);
  });

  it('hasWarning is false if no logs', () => {
    const result = new AnalyzeResult(
      { counts: { errors: 0, warnings: 0, info: 0 }, lines: [] },
      makeOptions(FailOnEnum.Warning),
    );
    expect(result.hasWarning).toBe(false);
  });

  it('commentBody returns empty string if no lines', () => {
    const result = new AnalyzeResult(
      { counts: { errors: 0, warnings: 0, info: 0 }, lines: [] },
      makeOptions(FailOnEnum.Warning),
    );
    expect(result.commentBody).toBe('');
  });

  it('commentBody returns formatted string for lines', () => {
    const fakeLine: Partial<ParsedLine> = {
      urls: ['url1', 'url2'],
      isFail: true,
      emoji: ':bangbang:',
      line: 12,
      column: 34,
      message: 'lineMessage',
      lintName: 'lint_name',
      type: DartAnalyzeLogTypeEnum.Error,
    };
    const file: Partial<ModifiedFile> = {
      name: 'file.dart',
    };
    const result = new AnalyzeResult(
      {
        counts: { errors: 1, warnings: 0, info: 0 },
        lines: [{ line: fakeLine as ParsedLine, file: file as ModifiedFile }],
      },
      makeOptions(FailOnEnum.Error, true),
    );
    expect(result.commentBody).toContain(':x:');
    expect(result.commentBody).toContain(':bangbang:');
    expect(result.commentBody).toContain(':x: :');
    expect(result.commentBody).toContain('See [link](url1) or [link](url2).');
  });
});
