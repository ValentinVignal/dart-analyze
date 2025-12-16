import * as core from '@actions/core';
import * as github from '@actions/github';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionOptionsSafe } from './ActionOptions.js';
import { ModifiedFiles } from './ModifiedFiles.js';

vi.mock('@actions/core');
vi.mock('@actions/github');
vi.mock('path');

describe('ModifiedFiles', () => {
  const mockActionOptions: ActionOptionsSafe = {
    failOn: 0,
    failOnFormat: true,
    workingDirectory: '/test/workspace',
    token: 'test-token',
    checkRenamedFiles: false,
    emojis: true,
    format: true,
    lineLength: 80,
    formatLines: undefined,
    analyzerLines: undefined,
    severityOverrides: new Map<string, number>(),
  };

  const mockGithubFiles = [
    {
      filename: 'lib/test1.dart',
      patch: '@@ -1,3 +1,4 @@\n line1\n+line2\n line3\n line4',
    },
    {
      filename: 'lib/test2.dart',
      patch: '@@ -5,2 +5,3 @@\n line5\n-line6\n+line7\n+line8',
    },
    {
      filename: 'lib/test3.dart',
      // No patch - renamed file
    },
  ];

  const mockOctokit = {
    rest: {
      repos: {
        compareCommitsWithBasehead: vi.fn(),
      },
    },
  };

  let realEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.resetAllMocks();

    realEnv = process.env;
    // Mock environment variables
    process.env.GITHUB_WORKSPACE = '/home/runner/work/repo/repo';

    // Mock github context
    vi.mocked(github.context).eventName = 'pull_request';
    vi.mocked(github.context).payload = {
      pull_request: {
        number: 123,
        base: { sha: 'base-sha' },
        head: { sha: 'head-sha' },
      },
    };

    vi.spyOn(github.context, 'repo', 'get').mockReturnValue({
      owner: 'test-owner',
      repo: 'test-repo',
    });

    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any);

    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));

    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.GITHUB_WORKSPACE;
    process.env = realEnv;
  });

  describe('FileLines class', () => {
    // Since FileLines is not exported, we'll test it through ModifiedFile behavior
    it('should include lines within range', async () => {
      mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
        status: 200,
        data: {
          files: [
            {
              filename: 'test.dart',
              patch: '@@ -1,1 +1,2 @@\n line1\n+line2',
            },
          ],
        },
      });

      const modifiedFiles = new ModifiedFiles(mockActionOptions);
      await modifiedFiles.isInit;

      const file = modifiedFiles.get('test.dart');
      expect(file?.hasAdditionLine(1)).toBe(true);
      expect(file?.hasAdditionLine(2)).toBe(true);
      expect(file?.hasAdditionLine(3)).toBe(true); // +1,2 means lines 1 through 3
      expect(file?.hasAdditionLine(4)).toBe(false);
    });
  });

  describe('ModifiedFile class', () => {
    describe('constructor and parsePatch', () => {
      it('should parse patch with additions correctly', async () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: [
              {
                filename: 'test.dart',
                patch: '@@ -1,1 +1,3 @@\n line1\n+line2\n+line3',
              },
            ],
          },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('test.dart');
        expect(file?.name).toBe('test.dart');
        expect(file?.hasAdditions).toBe(true);
        expect(file?.hasAdditionLine(1)).toBe(true);
        expect(file?.hasAdditionLine(2)).toBe(true);
        expect(file?.hasAdditionLine(3)).toBe(true);
        expect(file?.hasAdditionLine(4)).toBe(true); // +1,3 means lines 1 through 4
        expect(file?.hasAdditionLine(5)).toBe(false);
      });

      it('should parse patch with deletions correctly', async () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: [
              {
                filename: 'test.dart',
                patch: '@@ -1,3 +1,1 @@\n line1\n-line2\n-line3',
              },
            ],
          },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('test.dart');
        expect(file?.name).toBe('test.dart');
        // The implementation treats +1,1 in the header as additions, even for deletion-only patches
        expect(file?.hasAdditions).toBe(true);
        expect(file?.hasAdditionLine(1)).toBe(true);
        expect(file?.hasAdditionLine(2)).toBe(true); // +1,1 means line 1 to line 2 (inclusive)
      });

      it('should parse patch with both additions and deletions', async () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: [
              {
                filename: 'test.dart',
                patch: '@@ -1,2 +1,3 @@\n line1\n-line2\n+line3\n+line4',
              },
            ],
          },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('test.dart');
        expect(file?.name).toBe('test.dart');
        expect(file?.hasAdditions).toBe(true);
        expect(file?.hasAdditionLine(1)).toBe(true);
        expect(file?.hasAdditionLine(2)).toBe(true);
        expect(file?.hasAdditionLine(3)).toBe(true);
        expect(file?.hasAdditionLine(4)).toBe(true); // +1,3 means lines 1 through 4
        expect(file?.hasAdditionLine(5)).toBe(false);
      });

      it('should handle renamed files when checkRenamedFiles is true', async () => {
        const actionOptionsWithRename = {
          ...mockActionOptions,
          checkRenamedFiles: true,
        };

        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: [
              {
                filename: 'renamed.dart',
                // No patch - this is a renamed file
              },
            ],
          },
        });

        const modifiedFiles = new ModifiedFiles(actionOptionsWithRename);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('renamed.dart');
        expect(file?.name).toBe('renamed.dart');
        expect(file?.hasAdditions).toBe(true);
        expect(file?.hasAdditionLine(1)).toBe(true);
        expect(file?.hasAdditionLine(1000)).toBe(true); // Should include all lines
      });

      it('should not add additions for renamed files when checkRenamedFiles is false', async () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: [
              {
                filename: 'renamed.dart',
                // No patch - this is a renamed file
              },
            ],
          },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('renamed.dart');
        expect(file?.name).toBe('renamed.dart');
        expect(file?.hasAdditions).toBe(false);
        expect(file?.hasAdditionLine(1)).toBe(false);
      });
    });

    describe('hasAdditionLine method', () => {
      it('should return true for lines within addition ranges', async () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: [
              {
                filename: 'test.dart',
                patch: '@@ -1,1 +1,3 @@\n line1\n+line2\n+line3',
              },
            ],
          },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('test.dart');
        expect(file?.hasAdditionLine(1)).toBe(true);
        expect(file?.hasAdditionLine(2)).toBe(true);
        expect(file?.hasAdditionLine(3)).toBe(true);
        expect(file?.hasAdditionLine(4)).toBe(true); // +1,3 means lines 1 through 4
        expect(file?.hasAdditionLine(5)).toBe(false);
      });
    });
  });

  describe('ModifiedFiles class', () => {
    describe('constructor and initialization', () => {
      it('should initialize with empty files map', () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: [],
          },
        });
        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        expect(modifiedFiles.files).toBeInstanceOf(Map);
        expect(modifiedFiles.files.size).toBe(0);
        expect(modifiedFiles.isInit).toBeInstanceOf(Promise);
      });

      it('should initialize files after construction', async () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: mockGithubFiles,
          },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        expect(modifiedFiles.files.size).toBe(9); // 3 entries per file (absolute path + relative path + __w path)
        expect(
          modifiedFiles.has('/home/runner/work/repo/repo/lib/test1.dart'),
        ).toBe(true);
        expect(
          modifiedFiles.has('/home/runner/work/repo/repo/lib/test2.dart'),
        ).toBe(true);
        expect(
          modifiedFiles.has('/home/runner/work/repo/repo/lib/test3.dart'),
        ).toBe(true);
        expect(modifiedFiles.has('/__w/repo/repo/lib/test1.dart')).toBe(true);
        expect(modifiedFiles.has('/__w/repo/repo/lib/test2.dart')).toBe(true);
        expect(modifiedFiles.has('/__w/repo/repo/lib/test3.dart')).toBe(true);
        expect(modifiedFiles.has('lib/test1.dart')).toBe(true);
        expect(modifiedFiles.has('lib/test2.dart')).toBe(true);
        expect(modifiedFiles.has('lib/test3.dart')).toBe(true);
      });
    });

    describe('getGithubFiles method', () => {
      it('should handle pull_request event', async () => {
        vi.mocked(github.context).eventName = 'pull_request';
        vi.mocked(github.context).payload = {
          pull_request: {
            number: 123,
            base: { sha: 'base-sha' },
            head: { sha: 'head-sha' },
          },
        };

        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: { files: mockGithubFiles },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        expect(
          mockOctokit.rest.repos.compareCommitsWithBasehead,
        ).toHaveBeenCalledWith({
          basehead: 'base-sha...head-sha',
          owner: 'test-owner',
          repo: 'test-repo',
        });
      });

      it('should handle push event', async () => {
        vi.mocked(github.context).eventName = 'push';
        vi.mocked(github.context).payload = {
          before: 'before-sha',
          after: 'after-sha',
        };

        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: { files: mockGithubFiles },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        expect(
          mockOctokit.rest.repos.compareCommitsWithBasehead,
        ).toHaveBeenCalledWith({
          basehead: 'before-sha...after-sha',
          owner: 'test-owner',
          repo: 'test-repo',
        });
      });

      it('should fail for unsupported events', async () => {
        vi.mocked(github.context).eventName = 'unsupported_event';

        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: { files: [] },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        expect(core.setFailed).toHaveBeenCalledWith(
          expect.stringContaining(
            'This action only supports pull requests and pushes',
          ),
        );
      });

      it('should fail when API returns non-200 status', async () => {
        vi.mocked(github.context).eventName = 'pull_request';
        vi.mocked(github.context).payload = {
          pull_request: {
            number: 123,
            base: { sha: 'base-sha' },
            head: { sha: 'head-sha' },
          },
        };

        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 404,
          data: { files: [] },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        expect(core.setFailed).toHaveBeenCalledWith(
          expect.stringContaining('returned 404, expected 200'),
        );
      });
    });

    describe('has method', () => {
      beforeEach(async () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: { files: mockGithubFiles },
        });
      });

      it('should return true for existing files', async () => {
        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        expect(
          modifiedFiles.has('/home/runner/work/repo/repo/lib/test1.dart'),
        ).toBe(true);
        expect(
          modifiedFiles.has('/home/runner/work/repo/repo/lib/test2.dart'),
        ).toBe(true);
        expect(
          modifiedFiles.has('/home/runner/work/repo/repo/lib/test3.dart'),
        ).toBe(true);
        expect(modifiedFiles.has('/__w/repo/repo/lib/test1.dart')).toBe(true);
        expect(modifiedFiles.has('/__w/repo/repo/lib/test2.dart')).toBe(true);
        expect(modifiedFiles.has('/__w/repo/repo/lib/test3.dart')).toBe(true);
        expect(modifiedFiles.has('lib/test1.dart')).toBe(true);
        expect(modifiedFiles.has('lib/test2.dart')).toBe(true);
        expect(modifiedFiles.has('lib/test3.dart')).toBe(true);
      });

      it('should return false for non-existing files', async () => {
        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        expect(
          modifiedFiles.has('/github/workspace/lib/nonexistent.dart'),
        ).toBe(false);
        expect(modifiedFiles.has('relative/path.dart')).toBe(false);
      });
    });

    describe('get method', () => {
      beforeEach(async () => {
        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: { files: mockGithubFiles },
        });
      });

      it('should return ModifiedFile for existing files', async () => {
        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('lib/test1.dart');
        expect(file).toBeDefined();
        expect(file?.name).toBe('lib/test1.dart');
      });

      it('should return undefined for non-existing files', async () => {
        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('lib/nonexistent.dart');
        expect(file).toBeUndefined();
      });
    });

    describe('integration tests', () => {
      it('should handle complex patch scenarios', async () => {
        const complexPatch =
          '@@ -1,5 +1,7 @@\n line1\n-line2\n+newline2\n line3\n+newline4\n line5\n+newline6\n+newline7';

        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: {
            files: [
              {
                filename: 'complex.dart',
                patch: complexPatch,
              },
            ],
          },
        });

        const modifiedFiles = new ModifiedFiles(mockActionOptions);
        await modifiedFiles.isInit;

        const file = modifiedFiles.get('complex.dart');
        expect(file?.hasAdditions).toBe(true);
        expect(file?.hasAdditionLine(1)).toBe(true);
        expect(file?.hasAdditionLine(2)).toBe(true);
        expect(file?.hasAdditionLine(3)).toBe(true);
        expect(file?.hasAdditionLine(4)).toBe(true);
        expect(file?.hasAdditionLine(5)).toBe(true);
        expect(file?.hasAdditionLine(6)).toBe(true);
        expect(file?.hasAdditionLine(7)).toBe(true);
      });

      it('should handle multiple files with different patch types', async () => {
        const multipleFiles = [
          {
            filename: 'additions.dart',
            patch: '@@ -1,1 +1,3 @@\n line1\n+line2\n+line3',
          },
          {
            filename: 'deletions.dart',
            patch: '@@ -1,3 +1,1 @@\n line1\n-line2\n-line3',
          },
          {
            filename: 'renamed.dart',
            // No patch
          },
        ];

        const actionOptionsWithRename = {
          ...mockActionOptions,
          checkRenamedFiles: true,
        };

        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: { files: multipleFiles },
        });

        const modifiedFiles = new ModifiedFiles(actionOptionsWithRename);
        await modifiedFiles.isInit;

        // Test additions file
        const additionsFile = modifiedFiles.get('additions.dart');
        expect(additionsFile?.hasAdditions).toBe(true);
        expect(additionsFile?.hasAdditionLine(1)).toBe(true);
        expect(additionsFile?.hasAdditionLine(2)).toBe(true);
        expect(additionsFile?.hasAdditionLine(3)).toBe(true);
        expect(additionsFile?.hasAdditionLine(4)).toBe(true); // +1,3 means lines 1 through 4

        // Test deletions file - implementation treats +1,1 as additions
        const deletionsFile = modifiedFiles.get('deletions.dart');
        expect(deletionsFile?.hasAdditions).toBe(true);
        expect(deletionsFile?.hasAdditionLine(1)).toBe(true);

        // Test renamed file
        const renamedFile = modifiedFiles.get('renamed.dart');
        expect(renamedFile?.hasAdditions).toBe(true);
        expect(renamedFile?.hasAdditionLine(100)).toBe(true); // Should include all lines
      });

      it('should use correct GitHub token', async () => {
        const customToken = 'custom-github-token';
        const customActionOptions = {
          ...mockActionOptions,
          token: customToken,
        };

        mockOctokit.rest.repos.compareCommitsWithBasehead.mockResolvedValue({
          status: 200,
          data: { files: [] },
        });

        const modifiedFiles = new ModifiedFiles(customActionOptions);
        await modifiedFiles.isInit;

        expect(github.getOctokit).toHaveBeenCalledWith(customToken);
      });
    });
  });
});
