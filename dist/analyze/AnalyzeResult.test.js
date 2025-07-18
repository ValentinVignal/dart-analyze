import { describe, it, expect } from 'vitest';
import { AnalyzeResult } from './AnalyzeResult.js';
import { FailOnEnum } from '../utils/FailOn.js';
const makeOptions = (failOn, emojis = false) => ({ failOn, emojis });
describe('AnalyzeResult', () => {
    it('should be successful if failCount is 0', () => {
        const result = new AnalyzeResult({ counts: { errors: 0, warnings: 0, info: 0 }, lines: [] }, makeOptions(FailOnEnum.Nothing));
        expect(result.success).toBe(true);
    });
    it('should not be successful if failCount is nonzero', () => {
        const result = new AnalyzeResult({ counts: { errors: 1, warnings: 0, info: 0 }, lines: [] }, makeOptions(FailOnEnum.Error));
        expect(result.success).toBe(false);
    });
    it('hasWarning is true if any logs', () => {
        const result = new AnalyzeResult({ counts: { errors: 0, warnings: 1, info: 0 }, lines: [] }, makeOptions(FailOnEnum.Warning));
        expect(result.hasWarning).toBe(true);
    });
    it('hasWarning is false if no logs', () => {
        const result = new AnalyzeResult({ counts: { errors: 0, warnings: 0, info: 0 }, lines: [] }, makeOptions(FailOnEnum.Warning));
        expect(result.hasWarning).toBe(false);
    });
    it('commentBody returns empty string if no lines', () => {
        const result = new AnalyzeResult({ counts: { errors: 0, warnings: 0, info: 0 }, lines: [] }, makeOptions(FailOnEnum.Warning));
        expect(result.commentBody).toBe('');
    });
    it('commentBody returns formatted string for lines', () => {
        const fakeLine = {
            urls: ['url1', 'url2'],
            isFail: true,
            emoji: ':bangbang:',
            humanReadableString: 'Error - `file.dart`:1:2 - Message (lint).',
        };
        const result = new AnalyzeResult({ counts: { errors: 1, warnings: 0, info: 0 }, lines: [fakeLine] }, makeOptions(FailOnEnum.Error, true));
        expect(result.commentBody).toContain(':x:');
        expect(result.commentBody).toContain(':bangbang:');
        expect(result.commentBody).toContain('Error - `file.dart`:1:2 - Message (lint).');
        expect(result.commentBody).toContain('See [link](url1) or [link](url2).');
    });
});
//# sourceMappingURL=AnalyzeResult.test.js.map