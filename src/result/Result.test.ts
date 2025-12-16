const commentMock = vi.hoisted(() => vi.fn());
vi.mock('../utils/comment.ts', () => ({ comment: commentMock }));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyzeResult } from '../analyze/AnalyzeResult.js';
import { FormatResult } from '../format/FormatResult.js';
import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
import { FailOnEnum } from '../utils/FailOn.js';
import { Result } from './Result.js';

export function createAnalyzeResultWithSuccess(
  success: boolean,
  actionOptions: ActionOptionsSafe,
) {
  // If success is false, failCount must be > 0, but only if failOn is not Nothing
  let errors = 0,
    warnings = 0,
    info = 0,
    notes = 0;
  if (!success && actionOptions.failOn !== 4) {
    errors = 1;
  }
  const counts = { errors, warnings, info, notes };
  return new AnalyzeResult({ counts, lines: [] }, actionOptions);
}

export function createFormatResultWithSuccess(
  success: boolean,
  actionOptions: ActionOptionsSafe,
) {
  // If success is false, failOn must be Format and files must be non-empty
  if (success) {
    return new FormatResult(actionOptions, { files: new Set() });
  } else {
    return new FormatResult(
      { ...actionOptions, failOn: 3 },
      { files: new Set(['foo.dart']) },
    );
  }
}

describe('Result', () => {
  let actionOptions: import('../utils/ActionOptions.js').ActionOptionsSafe;
  let analyze: AnalyzeResult;
  let format: FormatResult;

  beforeEach(() => {
    actionOptions = {
      format: true,
      emojis: true,
      failOn: FailOnEnum.Nothing,
      failOnFormat: true,
      workingDirectory: '.',
      token: 'token',
      severityOverrides: new Map<string, number>(),
    };

    analyze = createAnalyzeResultWithSuccess(true, actionOptions);
    format = createFormatResultWithSuccess(true, actionOptions);
  });

  it('should be successful if both analyze and format are successful', () => {
    const result = new Result({ analyze, format }, actionOptions);
    expect(result.success).toBe(true);
  });

  it('should not be successful if analyze fails', () => {
    const failOnErrorOptions = { ...actionOptions, failOn: FailOnEnum.Error };
    const failedAnalyze = createAnalyzeResultWithSuccess(
      false,
      failOnErrorOptions,
    );
    const result = new Result(
      { analyze: failedAnalyze, format },
      failOnErrorOptions,
    );
    expect(result.success).toBe(false);
  });

  it('should not be successful if format fails', () => {
    const failedFormat = createFormatResultWithSuccess(false, actionOptions);
    const result = new Result({ analyze, format: failedFormat }, actionOptions);
    expect(result.success).toBe(false);
  });

  it('should call comment util with correct message', async () => {
    const result = new Result({ analyze, format }, actionOptions);
    await result.comment();
    expect(commentMock).toHaveBeenCalled();
  });

  it('should log info if success and no issues', () => {
    const info = vi
      .spyOn(require('@actions/core'), 'info')
      .mockImplementation(() => {});
    const result = new Result({ analyze, format }, actionOptions);
    result.log();
    expect(info).toHaveBeenCalled();
    info.mockRestore();
  });

  it('should log warning if success but has issues', () => {
    // Simulate issues by using a custom AnalyzeResult with counts.total > 0
    const analyzeWithIssues = new (analyze.constructor as any)(
      {
        counts: { errors: 0, warnings: 0, info: 1, notes: 0 },
        lines: [],
      },
      actionOptions,
    );
    const warning = vi
      .spyOn(require('@actions/core'), 'warning')
      .mockImplementation(() => {});
    const result = new Result(
      { analyze: analyzeWithIssues, format },
      actionOptions,
    );
    result.log();
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });

  it('should log setFailed if not successful', () => {
    const failOnErrorOptions = { ...actionOptions, failOn: FailOnEnum.Error };
    const failedAnalyze = createAnalyzeResultWithSuccess(
      false,
      failOnErrorOptions,
    );
    const setFailed = vi
      .spyOn(require('@actions/core'), 'setFailed')
      .mockImplementation(() => {});
    const result = new Result(
      { analyze: failedAnalyze, format },
      failOnErrorOptions,
    );
    result.log();
    expect(setFailed).toHaveBeenCalled();
    setFailed.mockRestore();
  });

  describe('.count', () => {
    it('should return the count of errors', () => {
      const result = new Result(
        {
          analyze: new AnalyzeResult(
            {
              counts: { errors: 1, warnings: 2, info: 3, notes: 4 },
              lines: [],
            },
            { ...actionOptions, failOn: FailOnEnum.Warning },
          ),
          format: new FormatResult(actionOptions, {
            files: new Set(['file1.dart', 'file2.dart']),
          }),
        },
        actionOptions,
      );
      expect(result['count']).toBe(12);
    });
  });

  describe('.issueCountMessage', () => {
    it('should return the message listing the count of issues', () => {
      const testActionOptions = {
        ...actionOptions,
        failOn: FailOnEnum.Warning,
      };
      const result = new Result(
        {
          analyze: new AnalyzeResult(
            {
              counts: { errors: 1, warnings: 2, info: 3, notes: 4 },
              lines: [],
            },
            testActionOptions,
          ),
          format: new FormatResult(testActionOptions, {
            files: new Set(['file1.dart', 'file2.dart']),
          }),
        },
        testActionOptions,
      );
      expect(result['issueCountMessage']({ emojis: true }))
        .toEqual(`:x: Dart Analyzer found 12 issues
- :x: **1 error.**
- :warning: **2 warnings.**
- :eyes: 3 info logs.
- :memo: 4 note logs.
- :poop: **2 formatting issues.**`);
    });
  });
});
