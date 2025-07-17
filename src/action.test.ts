import { vi, describe, it, expect, beforeEach } from 'vitest';
import { run } from './action.js';
import { FailOnEnum } from './utils/FailOn.js';

vi.mock('@actions/core');
vi.mock('./analyze/analyze.js', () => ({
  analyze: vi.fn().mockResolvedValue({}),
}));
vi.mock('./format/format.js', () => ({
  format: vi.fn().mockResolvedValue({}),
}));
vi.mock('./result/Result.js', () => {
  return {
    Result: vi.fn().mockImplementation(() => ({
      success: true,
      comment: vi.fn(),
      log: vi.fn(),
    })),
  };
});
vi.mock('./utils/IgnoredFiles.js', () => ({
  IgnoredFiles: vi.fn().mockImplementation(() => ({})),
}));
vi.mock('./utils/ModifiedFiles.js', () => ({
  ModifiedFiles: vi
    .fn()
    .mockImplementation(() => ({ isInit: Promise.resolve() })),
}));
vi.mock('./utils/ActionOptions.js', () => ({
  applyDefaults: vi.fn((opts: any) => opts),
}));

describe('run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run', async () => {
    await expect(
      run({
        token: 'abc',
        workingDirectory: '.',
        format: true,
        emojis: true,
        failOn: FailOnEnum.Warning,
      }),
    ).resolves.toBeUndefined();
  });
});
