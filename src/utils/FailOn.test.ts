import { describe, expect, it } from 'vitest';
import { FailOn, FailOnEnum } from './FailOn.js';

describe('FailOn', () => {
  describe('fromInput', () => {
    it('returns FailOnEnum.Nothing for input "nothing"', () => {
      expect(FailOn.fromInput('nothing')).toBe(FailOnEnum.Nothing);
    });
    it('returns FailOnEnum.Format for input "format"', () => {
      expect(FailOn.fromInput('note')).toBe(FailOnEnum.Note);
    });
    it('returns FailOnEnum.Info for input "info"', () => {
      expect(FailOn.fromInput('info')).toBe(FailOnEnum.Info);
    });
    it('returns FailOnEnum.Warning for input "warning"', () => {
      expect(FailOn.fromInput('warning')).toBe(FailOnEnum.Warning);
    });
    it('returns FailOnEnum.Warning for unknown input', () => {
      expect(FailOn.fromInput('unknown')).toBe(FailOnEnum.Warning);
    });
    it('returns FailOnEnum.Warning for undefined input', () => {
      expect(FailOn.fromInput(undefined)).toBe(FailOnEnum.Warning);
    });
  });
});
