import { describe, expect, it } from 'vitest';
import { FailOnEnum } from '../utils/FailOn.js';
import type { ModifiedFile } from '../utils/ModifiedFiles.js';
import { AnalyzeResult } from './AnalyzeResult.js';
import { DartAnalyzeLogTypeEnum } from './DartAnalyzeLogType.js';
import type { ParsedLine } from './ParsedLine.js';

const makeOptions = (failOn: number, emojis = false) =>
  ({ failOn, emojis }) as any;

describe('AnalyzeResult', () => {
  describe('.success', () => {
    it('should be successful if failCount is 0', () => {
      const result = new AnalyzeResult(
        { counts: { errors: 0, warnings: 0, info: 0, notes: 0 }, lines: [] },
        makeOptions(FailOnEnum.Nothing),
      );
      expect(result.success).toBe(true);
    });

    it('should not be successful if failCount is nonzero', () => {
      const result = new AnalyzeResult(
        { counts: { errors: 1, warnings: 0, info: 0, notes: 0 }, lines: [] },
        makeOptions(FailOnEnum.Error),
      );
      expect(result.success).toBe(false);
    });

    it('hasWarning is true if any logs', () => {
      const result = new AnalyzeResult(
        { counts: { errors: 0, warnings: 1, info: 0, notes: 0 }, lines: [] },
        makeOptions(FailOnEnum.Warning),
      );
      expect(result.hasWarning).toBe(true);
    });

    it('hasWarning is false if no logs', () => {
      const result = new AnalyzeResult(
        { counts: { errors: 0, warnings: 0, info: 0, notes: 0 }, lines: [] },
        makeOptions(FailOnEnum.Warning),
      );
      expect(result.hasWarning).toBe(false);
    });

    it('commentBody returns empty string if no lines', () => {
      const result = new AnalyzeResult(
        { counts: { errors: 0, warnings: 0, info: 0, notes: 0 }, lines: [] },
        makeOptions(FailOnEnum.Warning),
      );
      expect(result.commentBody).toBe('');
    });

    it('should be successful it fails on info and there are only notes', () => {
      const result = new AnalyzeResult(
        { counts: { errors: 0, warnings: 0, info: 0, notes: 1 }, lines: [] },
        makeOptions(FailOnEnum.Info),
      );
      expect(result.success).toBe(true);
    });

    it('should be false it fails on notes and there are only notes', () => {
      const result = new AnalyzeResult(
        { counts: { errors: 0, warnings: 0, info: 0, notes: 1 }, lines: [] },
        makeOptions(FailOnEnum.Note),
      );
      expect(result.success).toBe(false);
    });
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
        counts: { errors: 1, warnings: 0, info: 0, notes: 0 },
        lines: [{ line: fakeLine as ParsedLine, file: file as ModifiedFile }],
      },
      makeOptions(FailOnEnum.Error, true),
    );
    expect(result.commentBody).toContain(':bangbang:');
    expect(result.commentBody).toContain('See [link](url1) or [link](url2).');
  });

  it('It should return the comment body for an successful action with 1 note', () => {
    const fakeLine: Partial<ParsedLine> = {
      urls: ['url1', 'url2'],
      isFail: false,
      emoji: ':memo:',
      line: 12,
      column: 34,
      message: 'lineMessage',
      lintName: 'lint_name',
      type: DartAnalyzeLogTypeEnum.Note,
    };
    const file: Partial<ModifiedFile> = {
      name: 'file.dart',
    };
    const result = new AnalyzeResult(
      {
        counts: { errors: 0, warnings: 0, info: 0, notes: 1 },
        lines: [{ line: fakeLine as ParsedLine, file: file as ModifiedFile }],
      },
      makeOptions(FailOnEnum.Error, true),
    );
    expect(result.commentBody).toEqual(
      '- :memo: Note - `file.dart`:12:34 - lineMessage (lint_name). See [link](url1) or [link](url2).',
    );
  });
});
