import { describe, it, expect } from 'vitest';
import { FormatResult } from './FormatResult.js';
import { FailOnEnum } from '../utils/FailOn.js';
describe('FormatResult', () => {
    describe('constructor', () => {
        it('should create a FormatResult with empty files set when no params provided', () => {
            const result = new FormatResult({});
            expect(result.count).toBe(0);
        });
        it('should create a FormatResult with provided files', () => {
            const files = new Set(['file1.dart', 'file2.dart']);
            const result = new FormatResult({}, { files });
            expect(result.count).toBe(2);
        });
    });
    describe('success getter', () => {
        it('should return true when failOn is not Format', () => {
            const actionOptions = { failOn: FailOnEnum.Warning };
            const files = new Set(['file1.dart', 'file2.dart']);
            const result = new FormatResult(actionOptions, { files });
            expect(result.success).toBe(true);
        });
        it('should return true when failOn is Format but no files', () => {
            const actionOptions = { failOn: FailOnEnum.Format };
            const result = new FormatResult(actionOptions);
            expect(result.success).toBe(true);
        });
        it('should return false when failOn is Format and there are files', () => {
            const actionOptions = { failOn: FailOnEnum.Format };
            const files = new Set(['file1.dart', 'file2.dart']);
            const result = new FormatResult(actionOptions, { files });
            expect(result.success).toBe(false);
        });
        it('should return true when failOn is Error and there are files', () => {
            const actionOptions = { failOn: FailOnEnum.Error };
            const files = new Set(['file1.dart', 'file2.dart']);
            const result = new FormatResult(actionOptions, { files });
            expect(result.success).toBe(true);
        });
        it('should return true when failOn is Nothing and there are files', () => {
            const actionOptions = { failOn: FailOnEnum.Nothing };
            const files = new Set(['file1.dart', 'file2.dart']);
            const result = new FormatResult(actionOptions, { files });
            expect(result.success).toBe(true);
        });
    });
    describe('count getter', () => {
        it('should return 0 for empty files set', () => {
            const actionOptions = {};
            const result = new FormatResult(actionOptions);
            expect(result.count).toBe(0);
        });
        it('should return correct count for files set', () => {
            const actionOptions = {};
            const files = new Set(['file1.dart', 'file2.dart', 'file3.dart']);
            const result = new FormatResult(actionOptions, { files });
            expect(result.count).toBe(3);
        });
    });
    describe('commentBody getter', () => {
        it('should return empty string for empty files set', () => {
            const actionOptions = {};
            const result = new FormatResult(actionOptions);
            expect(result.commentBody).toBe('');
        });
        it('should return formatted comment with emojis when emojis are enabled', () => {
            const actionOptions = {
                failOn: FailOnEnum.Warning,
                emojis: true,
            };
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
            };
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
            };
            const files = new Set(['lib/single_file.dart']);
            const result = new FormatResult(actionOptions, { files });
            const expected = '- :poop:  `lib/single_file.dart` is not formatted.';
            expect(result.commentBody).toBe(expected);
        });
        it('should preserve file order in comment body', () => {
            const actionOptions = {
                failOn: FailOnEnum.Warning,
                emojis: false,
            };
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
        it('should work correctly with all FailOnEnum values', () => {
            const files = new Set(['test.dart']);
            // Test all FailOnEnum values
            Object.values(FailOnEnum).forEach((failOn) => {
                if (typeof failOn === 'number') {
                    const actionOptions = { failOn, emojis: true };
                    const result = new FormatResult(actionOptions, { files });
                    expect(result.count).toBe(1);
                    expect(result.commentBody).toContain('test.dart');
                    if (failOn === FailOnEnum.Format) {
                        expect(result.success).toBe(false);
                    }
                    else {
                        expect(result.success).toBe(true);
                    }
                }
            });
        });
        it('should handle complex file paths in comments', () => {
            const actionOptions = {
                failOn: FailOnEnum.Warning,
                emojis: true,
            };
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
//# sourceMappingURL=FormatResult.test.js.map