import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as exec from '@actions/exec';
import { FailOnEnum } from '../utils/FailOn.js';
import { IgnoredFiles } from '../utils/IgnoredFiles.js';
import { ModifiedFiles } from '../utils/ModifiedFiles.js';
import { format } from './Format.js';
import type { ActionOptionsSafe } from '../utils/ActionOptions.js';

describe('Format', () => {
  it('should concatenate the cwd to files from the format command to compare them with the modified files', async () => {
    const actionOptions = {
      format: true,
      workingDirectory: 'cwd/actionOptionWorkingDirectory',
      failOn: FailOnEnum.Format,
    } as ActionOptionsSafe;
    const ignoredFiles: Partial<IgnoredFiles> = {
      has: vi.fn(),
    };
    const modifiedFiles: Partial<ModifiedFiles> = {
      has: vi.fn(),
    };
    vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.spyOn(exec, 'exec').mockImplementationOnce(
      (
        commandLine: string,
        args: string[] | undefined,
        options: exec.ExecOptions | undefined,
      ): Promise<number> => {
        options!.listeners!.stdout!(
          Buffer.from(
            'Changed lib/file_0.dart\nChanged lib/file_1.dart\r\nChanged lib/file_2.dart',
          ),
        );
        return Promise.resolve(0);
      },
    );

    (ignoredFiles.has as any).mockReturnValue(false);
    (modifiedFiles.has as any).mockImplementation((file: string) => {
      return [
        'cwd/actionOptionWorkingDirectory/lib/file_0.dart',
        'cwd/actionOptionWorkingDirectory/lib/file_1.dart',
      ].includes(file);
    });

    const result = await format({
      modifiedFiles: modifiedFiles as ModifiedFiles,
      ignoredFiles: ignoredFiles as IgnoredFiles,
      actionOptions: actionOptions,
    });

    expect(result.success).toEqual(false); // It should fail because some modified files are not formatted.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).files).toEqual(
      new Set(['lib/file_0.dart', 'lib/file_1.dart']),
    ); // It should return the unformatted files.
    expect(modifiedFiles.has).toHaveBeenCalledTimes(3);
    // It should use the absolute unformatted file paths to compare them with
    // the modified files.
    expect(modifiedFiles.has).toHaveBeenCalledWith(
      'cwd/actionOptionWorkingDirectory/lib/file_0.dart',
    );
    expect(modifiedFiles.has).toHaveBeenCalledWith(
      'cwd/actionOptionWorkingDirectory/lib/file_1.dart',
    );
    expect(modifiedFiles.has).toHaveBeenCalledWith(
      'cwd/actionOptionWorkingDirectory/lib/file_2.dart',
    );

    // It should use the relative unformatted file paths to compare them with
    // the ignored files.
    expect(ignoredFiles.has).toHaveBeenCalledWith('lib/file_0.dart');
    expect(ignoredFiles.has).toHaveBeenCalledWith('lib/file_1.dart');
    expect(ignoredFiles.has).toHaveBeenCalledWith('lib/file_2.dart');
  });
});
