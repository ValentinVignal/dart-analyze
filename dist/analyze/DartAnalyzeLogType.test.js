import { describe, it, expect } from 'vitest';
import { DartAnalyzeLogType, DartAnalyzeLogTypeEnum, } from './DartAnalyzeLogType.js';
const mockOptions = (failOn) => ({ failOn });
describe('DartAnalyzeLogType', () => {
    it('typeFromKey returns correct enum', () => {
        expect(DartAnalyzeLogType.typeFromKey('ERROR')).toBe(DartAnalyzeLogTypeEnum.Error);
        expect(DartAnalyzeLogType.typeFromKey('WARNING')).toBe(DartAnalyzeLogTypeEnum.Warning);
        expect(DartAnalyzeLogType.typeFromKey('INFO')).toBe(DartAnalyzeLogTypeEnum.Info);
        expect(DartAnalyzeLogType.typeFromKey('OTHER')).toBe(DartAnalyzeLogTypeEnum.Info);
    });
    it('keyFromType returns correct key', () => {
        expect(DartAnalyzeLogType.keyFromType(DartAnalyzeLogTypeEnum.Error)).toBe('ERROR');
        expect(DartAnalyzeLogType.keyFromType(DartAnalyzeLogTypeEnum.Warning)).toBe('WARNING');
        expect(DartAnalyzeLogType.keyFromType(DartAnalyzeLogTypeEnum.Info)).toBe('WARNING');
    });
    it('typeToString returns correct string', () => {
        expect(DartAnalyzeLogType.typeToString(DartAnalyzeLogTypeEnum.Error)).toBe('Error');
        expect(DartAnalyzeLogType.typeToString(DartAnalyzeLogTypeEnum.Warning)).toBe('Warning');
        expect(DartAnalyzeLogType.typeToString(DartAnalyzeLogTypeEnum.Info)).toBe('Info');
    });
    it('isFail returns correct value for each failOn', () => {
        expect(DartAnalyzeLogType.isFail(mockOptions(4), DartAnalyzeLogTypeEnum.Error)).toBe(false); // Nothing
        expect(DartAnalyzeLogType.isFail(mockOptions(3), DartAnalyzeLogTypeEnum.Error)).toBe(false); // Format
        expect(DartAnalyzeLogType.isFail(mockOptions(2), DartAnalyzeLogTypeEnum.Error)).toBe(true); // Info
        expect(DartAnalyzeLogType.isFail(mockOptions(1), DartAnalyzeLogTypeEnum.Error)).toBe(true); // Warning
        expect(DartAnalyzeLogType.isFail(mockOptions(1), DartAnalyzeLogTypeEnum.Warning)).toBe(true);
        expect(DartAnalyzeLogType.isFail(mockOptions(1), DartAnalyzeLogTypeEnum.Info)).toBe(false);
        expect(DartAnalyzeLogType.isFail(mockOptions(0), DartAnalyzeLogTypeEnum.Error)).toBe(true); // Error
        expect(DartAnalyzeLogType.isFail(mockOptions(0), DartAnalyzeLogTypeEnum.Warning)).toBe(false);
    });
});
//# sourceMappingURL=DartAnalyzeLogType.test.js.map