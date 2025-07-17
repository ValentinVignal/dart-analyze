import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import { applyDefaults } from './ActionOptions.js';
import { FailOnEnum } from './FailOn.js';
import type { ActionOptions, ActionOptionsSafe } from './ActionOptions.js';

// Mock path module
vi.mock('path');

describe('ActionOptions', () => {
  const originalWorkspace = process.env.GITHUB_WORKSPACE;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GITHUB_WORKSPACE = '/github/workspace';

    // Mock path.resolve to return predictable results
    vi.mocked(path.resolve).mockImplementation((base, relative) => {
      if (relative === './') {
        return '/github/workspace';
      }
      return `${base}/${relative}`;
    });
  });

  afterEach(() => {
    if (originalWorkspace !== undefined) {
      process.env.GITHUB_WORKSPACE = originalWorkspace;
    } else {
      delete process.env.GITHUB_WORKSPACE;
    }
  });

  describe('applyDefaults function', () => {
    it('should apply default values to minimal options', () => {
      const options: ActionOptions = {
        token: 'test-token',
      };

      const result = applyDefaults(options);

      expect(result).toEqual({
        failOn: FailOnEnum.Warning,
        workingDirectory: '/github/workspace',
        token: 'test-token',
        checkRenamedFiles: false,
        emojis: true,
        format: true,
        lineLength: undefined,
        analyzerLines: undefined,
        formatLines: undefined,
      });
    });

    it('should preserve provided values over defaults', () => {
      const options: ActionOptions = {
        token: 'test-token',
        failOn: FailOnEnum.Error,
        workingDirectory: 'custom/path',
        checkRenamedFiles: true,
        emojis: false,
        format: false,
        lineLength: 120,
        analyzerLines: ['line1', 'line2'],
        formatLines: ['file1.dart', 'file2.dart'],
      };

      const result = applyDefaults(options);

      expect(result).toEqual({
        failOn: FailOnEnum.Error,
        workingDirectory: '/github/workspace/custom/path',
        token: 'test-token',
        checkRenamedFiles: true,
        emojis: false,
        format: false,
        lineLength: 120,
        analyzerLines: ['line1', 'line2'],
        formatLines: ['file1.dart', 'file2.dart'],
      });
    });

    it('should handle null lineLength', () => {
      const options: ActionOptions = {
        token: 'test-token',
        lineLength: null,
      };

      const result = applyDefaults(options);

      expect(result.lineLength).toBe(null);
    });

    it('should handle undefined lineLength', () => {
      const options: ActionOptions = {
        token: 'test-token',
        lineLength: undefined,
      };

      const result = applyDefaults(options);

      expect(result.lineLength).toBe(undefined);
    });

    it('should resolve working directory with default path', () => {
      const options: ActionOptions = {
        token: 'test-token',
      };

      applyDefaults(options);

      expect(path.resolve).toHaveBeenCalledWith('/github/workspace', './');
    });

    it('should resolve working directory with custom path', () => {
      const options: ActionOptions = {
        token: 'test-token',
        workingDirectory: 'src/dart',
      };

      applyDefaults(options);

      expect(path.resolve).toHaveBeenCalledWith(
        '/github/workspace',
        'src/dart',
      );
    });

    it('should handle all FailOnEnum values', () => {
      const testCases = [
        FailOnEnum.Error,
        FailOnEnum.Warning,
        FailOnEnum.Info,
        FailOnEnum.Format,
        FailOnEnum.Nothing,
      ];

      testCases.forEach((failOn) => {
        const options: ActionOptions = {
          token: 'test-token',
          failOn,
        };

        const result = applyDefaults(options);

        expect(result.failOn).toBe(failOn);
      });
    });

    it('should handle empty arrays for analyzerLines and formatLines', () => {
      const options: ActionOptions = {
        token: 'test-token',
        analyzerLines: [],
        formatLines: [],
      };

      const result = applyDefaults(options);

      expect(result.analyzerLines).toEqual([]);
      expect(result.formatLines).toEqual([]);
    });

    it('should handle zero lineLength', () => {
      const options: ActionOptions = {
        token: 'test-token',
        lineLength: 0,
      };

      const result = applyDefaults(options);

      expect(result.lineLength).toBe(0);
    });

    it('should handle very large lineLength', () => {
      const options: ActionOptions = {
        token: 'test-token',
        lineLength: 9999,
      };

      const result = applyDefaults(options);

      expect(result.lineLength).toBe(9999);
    });

    it('should handle complex working directory paths', () => {
      const options: ActionOptions = {
        token: 'test-token',
        workingDirectory: '../parent/child/subdir',
      };

      // Mock path.resolve to handle complex paths
      vi.mocked(path.resolve).mockReturnValue('/github/parent/child/subdir');

      const result = applyDefaults(options);

      expect(result.workingDirectory).toBe('/github/parent/child/subdir');
      expect(path.resolve).toHaveBeenCalledWith(
        '/github/workspace',
        '../parent/child/subdir',
      );
    });

    it('should maintain type safety for ActionOptionsSafe', () => {
      const options: ActionOptions = {
        token: 'test-token',
        failOn: FailOnEnum.Info,
        emojis: false,
        format: true,
      };

      const result: ActionOptionsSafe = applyDefaults(options);

      // Type checks - these should not cause TypeScript errors
      expect(typeof result.failOn).toBe('number');
      expect(typeof result.workingDirectory).toBe('string');
      expect(typeof result.token).toBe('string');
      expect(typeof result.emojis).toBe('boolean');
      expect(typeof result.format).toBe('boolean');
    });

    it('should handle partial options correctly', () => {
      // Test that ActionOptions can have partial properties
      const minimalOptions: ActionOptions = {
        token: 'required-token',
      };

      const partialOptions: ActionOptions = {
        token: 'partial-token',
        emojis: false,
        format: false,
      };

      const fullOptions: ActionOptions = {
        token: 'full-token',
        failOn: FailOnEnum.Nothing,
        workingDirectory: 'custom',
        checkRenamedFiles: true,
        emojis: true,
        format: true,
        lineLength: 100,
        analyzerLines: ['analyze1'],
        formatLines: ['format1'],
      };

      expect(() => applyDefaults(minimalOptions)).not.toThrow();
      expect(() => applyDefaults(partialOptions)).not.toThrow();
      expect(() => applyDefaults(fullOptions)).not.toThrow();
    });
  });

  describe('Type definitions', () => {
    it('should ensure ActionOptionsSafe has all required properties', () => {
      const safeOptions: ActionOptionsSafe = {
        failOn: FailOnEnum.Warning,
        workingDirectory: '/test',
        token: 'token',
        emojis: true,
        format: true,
      };

      // These properties should be accessible without TypeScript errors
      expect(safeOptions.failOn).toBeDefined();
      expect(safeOptions.workingDirectory).toBeDefined();
      expect(safeOptions.token).toBeDefined();
      expect(safeOptions.emojis).toBeDefined();
      expect(safeOptions.format).toBeDefined();
    });

    it('should ensure ActionOptions allows partial properties', () => {
      // These should all be valid ActionOptions
      const option1: ActionOptions = { token: 'test' };
      const option2: ActionOptions = { token: 'test', emojis: false };
      const option3: ActionOptions = {
        token: 'test',
        failOn: FailOnEnum.Error,
      };

      expect(option1.token).toBe('test');
      expect(option2.token).toBe('test');
      expect(option3.token).toBe('test');
    });
  });
});
