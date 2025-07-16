import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockPath = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

vi.mock('path', () => mockPath);

const mockFs = vi.hoisted(() => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock('fs', () => mockFs);

const mockYaml = vi.hoisted(() => ({
  load: vi.fn(),
}));

vi.mock('js-yaml', () => mockYaml);

import type { ActionOptionsSafe } from './ActionOptions.js';
import { IgnoredFiles } from './IgnoredFiles.js';

describe('IgnoredFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('It should get the ignored files from the analysis_options.yaml file', () => {
    const actionOptions = {
      workingDirectory: 'working/directory',
    } as ActionOptionsSafe;

    mockPath.resolve.mockReturnValue('path/to/yaml');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('yamlContent');
    mockYaml.load.mockReturnValue({
      analyzer: {
        exclude: ['**/*.g.dart', 'lib/excluded.dart'],
      },
    });
    const ignoredFiles = new IgnoredFiles(actionOptions);

    expect(mockPath.resolve.mock.calls).toEqual([
      ['working/directory', 'analysis_options.yaml'],
    ]);
    expect(mockFs.readFileSync.mock.calls).toEqual([['path/to/yaml', 'utf8']]);
    expect(mockYaml.load.mock.calls).toEqual([['yamlContent']]);

    expect(ignoredFiles.has('lib/path/to/generated/file.g.dart')).toBe(true);
    expect(ignoredFiles.has('lib/path/to/normal/file')).toBe(false);
    expect(ignoredFiles.has('lib/main.dart')).toBe(false);
    expect(ignoredFiles.has('lib/excluded.dart')).toBe(true);
  });
  test('It should return the ignored files of the closest analysis_options.yaml file', () => {
    const actionOptions = {
      workingDirectory: 'working/directory',
    } as ActionOptionsSafe;

    mockPath.resolve.mockReturnValueOnce(
      'working/directory/analysis_options.yaml',
    );
    mockFs.existsSync.mockReturnValueOnce(false); // The file is not found.
    mockPath.resolve.mockReturnValueOnce('working'); // Returns the parent
    mockPath.resolve.mockReturnValueOnce('working/analysis_options.yaml'); // Yaml higher in the file tree.
    mockFs.existsSync.mockReturnValueOnce(true); // The file is not found.
    mockFs.readFileSync.mockReturnValue('yamlContent');
    mockYaml.load.mockReturnValue({
      analyzer: {
        exclude: ['**/*.g.dart', 'lib/excluded.dart'],
      },
    });
    const ignoredFiles = new IgnoredFiles(actionOptions);

    expect(mockPath.resolve.mock.calls).toEqual([
      ['working/directory', 'analysis_options.yaml'],
      ['working/directory', '..'],
      ['working', 'analysis_options.yaml'],
    ]);
    expect(mockFs.existsSync.mock.calls).toEqual([
      ['working/directory/analysis_options.yaml'],
      ['working/analysis_options.yaml'],
    ]);
    expect(mockFs.readFileSync.mock.calls).toEqual([
      ['working/analysis_options.yaml', 'utf8'],
    ]);
    expect(mockYaml.load.mock.calls).toEqual([['yamlContent']]);

    expect(ignoredFiles.has('lib/path/to/generated/file.g.dart')).toBe(true);
    expect(ignoredFiles.has('lib/path/to/normal/file')).toBe(false);
    expect(ignoredFiles.has('lib/main.dart')).toBe(false);
    expect(ignoredFiles.has('lib/excluded.dart')).toBe(true);
  });
});
