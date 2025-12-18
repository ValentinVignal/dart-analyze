import { describe, expect, it } from 'vitest';
import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
import { FailOnEnum } from '../utils/FailOn.js';
import { FormatResult } from './FormatResult.js';

describe('FormatResult', () => {
  describe('constructor', () => {
    it('should create a FormatResult with empty files set when no params provided', () => {
      const result = new FormatResult({} as ActionOptionsSafe);

      expect(result.count).toBe(0);
    });

    it('should create a FormatResult with provided files', () => {
      const files = new Set(['file1.dart', 'file2.dart']);
      const result = new FormatResult({} as ActionOptionsSafe, { files });

      expect(result.count).toBe(2);
    });
  });

  describe('success getter', () => {
    it('should return true when failOn is not Format', () => {
      const actionOptions = { failOn: FailOnEnum.Warning } as ActionOptionsSafe;
      const files = new Set(['file1.dart', 'file2.dart']);
      const result = new FormatResult(actionOptions, { files });

      expect(result.success).toBe(true);
    });

    it('should return true when failOn is Format but no files', () => {
      const actionOptions = { failOnFormat: true } as ActionOptionsSafe;
      const result = new FormatResult(actionOptions);

      expect(result.success).toBe(true);
    });

    it('should return false when failOn is Format and there are files', () => {
      const actionOptions = { failOnFormat: true } as ActionOptionsSafe;
      const files = new Set(['file1.dart', 'file2.dart']);
      const result = new FormatResult(actionOptions, { files });

      expect(result.success).toBe(false);
    });

    it('should return true when failOn is Error and there are files', () => {
      const actionOptions = { failOn: FailOnEnum.Error } as ActionOptionsSafe;
      const files = new Set(['file1.dart', 'file2.dart']);
      const result = new FormatResult(actionOptions, { files });

      expect(result.success).toBe(true);
    });

    it('should return true when failOn is Nothing and there are files', () => {
      const actionOptions = { failOn: FailOnEnum.Nothing } as ActionOptionsSafe;
      const files = new Set(['file1.dart', 'file2.dart']);
      const result = new FormatResult(actionOptions, { files });

      expect(result.success).toBe(true);
    });
  });

  describe('count getter', () => {
    it('should return 0 for empty files set', () => {
      const actionOptions = {} as ActionOptionsSafe;
      const result = new FormatResult(actionOptions);

      expect(result.count).toBe(0);
    });

    it('should return correct count for files set', () => {
      const actionOptions = {} as ActionOptionsSafe;
      const files = new Set(['file1.dart', 'file2.dart', 'file3.dart']);
      const result = new FormatResult(actionOptions, { files });

      expect(result.count).toBe(3);
    });
  });

  describe('hasIssues getter', () => {
    it('should return false when there are no issues', () => {
      const actionOptions = {} as ActionOptionsSafe;
      const result = new FormatResult(actionOptions);

      expect(result.hasIssues).toBe(false);
    });

    it('should return true when there are issues', () => {
      const actionOptions = {} as ActionOptionsSafe;
      const files = new Set(['file1.dart', 'file2.dart', 'file3.dart']);
      const result = new FormatResult(actionOptions, { files });

      expect(result.hasIssues).toBe(true);
    });
  });

  describe('commentBody getter', () => {
    it('should return empty string for empty files set', () => {
      const actionOptions = {} as ActionOptionsSafe;
      const result = new FormatResult(actionOptions);

      expect(result.commentBody).toBe('');
    });

    it('should return formatted comment with emojis when emojis are enabled', () => {
      const actionOptions = {
        failOn: FailOnEnum.Warning,
        emojis: true,
      } as ActionOptionsSafe;
      const files = new Set(['lib/file1.dart', 'lib/file2.dart']);
      const result = new FormatResult(actionOptions, { files });

      const expected = [
        '- :poop:  `lib/file1.dart` is not formatted.',
        '- :poop:  `lib/file2.dart` is not formatted.',
      ].join('\n');

      expect(result.commentBody).toBe(expected);
    });

    it('should return formatted comment without emojis when emojis are disabled', () => {
      const actionOptions = {
        failOn: FailOnEnum.Warning,
        emojis: false,
      } as ActionOptionsSafe;
      const files = new Set(['lib/file1.dart', 'lib/file2.dart']);
      const result = new FormatResult(actionOptions, { files });

      const expected = [
        '-  `lib/file1.dart` is not formatted.',
        '-  `lib/file2.dart` is not formatted.',
      ].join('\n');

      expect(result.commentBody).toBe(expected);
    });

    it('should handle single file correctly', () => {
      const actionOptions = {
        failOn: FailOnEnum.Warning,
        emojis: true,
      } as ActionOptionsSafe;
      const files = new Set(['lib/single_file.dart']);
      const result = new FormatResult(actionOptions, { files });

      const expected = '- :poop:  `lib/single_file.dart` is not formatted.';

      expect(result.commentBody).toBe(expected);
    });

    it('should preserve file order in comment body', () => {
      const actionOptions = {
        failOn: FailOnEnum.Warning,
        emojis: false,
      } as ActionOptionsSafe;
      const files = new Set(['a.dart', 'b.dart', 'c.dart']);
      const result = new FormatResult(actionOptions, { files });

      const lines = result.commentBody.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('`a.dart`');
      expect(lines[1]).toContain('`b.dart`');
      expect(lines[2]).toContain('`c.dart`');
    });
  });

  describe('integration tests', () => {
    it('should handle complex file paths in comments', () => {
      const actionOptions = {
        failOn: FailOnEnum.Warning,
        emojis: true,
      } as ActionOptionsSafe;
      const files = new Set([
        'lib/src/models/user.dart',
        'test/integration/auth_test.dart',
        'bin/main.dart',
      ]);
      const result = new FormatResult(actionOptions, { files });

      const commentBody = result.commentBody;
      expect(commentBody).toContain('`lib/src/models/user.dart`');
      expect(commentBody).toContain('`test/integration/auth_test.dart`');
      expect(commentBody).toContain('`bin/main.dart`');
      expect(commentBody.split('\n')).toHaveLength(3);
    });
  });
});
