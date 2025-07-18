import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as exec from '@actions/exec';
import { FailOnEnum } from '../utils/FailOn.js';
import { IgnoredFiles } from '../utils/IgnoredFiles.js';
import { ModifiedFiles } from '../utils/ModifiedFiles.js';
import { format } from './format.js';
describe('Format', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    it('should concatenate the cwd to files from the format command to compare them with the modified files', async () => {
        const actionOptions = {
            format: true,
            workingDirectory: 'cwd/actionOptionWorkingDirectory',
            failOn: FailOnEnum.Format,
        };
        const ignoredFiles = {
            has: vi.fn(),
        };
        const modifiedFiles = {
            has: vi.fn(),
        };
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(exec, 'exec').mockImplementationOnce((commandLine, args, options) => {
            options.listeners.stdout(Buffer.from('Changed lib/file_0.dart\nChanged lib/file_1.dart\r\nChanged lib/file_2.dart'));
            return Promise.resolve(0);
        });
        ignoredFiles.has.mockReturnValue(false);
        modifiedFiles.has.mockImplementation((file) => {
            return [
                'cwd/actionOptionWorkingDirectory/lib/file_0.dart',
                'cwd/actionOptionWorkingDirectory/lib/file_1.dart',
            ].includes(file);
        });
        const result = await format({
            modifiedFiles: modifiedFiles,
            ignoredFiles: ignoredFiles,
            actionOptions: actionOptions,
        });
        expect(result.success).toEqual(false); // It should fail because some modified files are not formatted.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(result.files).toEqual(new Set(['lib/file_0.dart', 'lib/file_1.dart'])); // It should return the unformatted files.
        expect(modifiedFiles.has).toHaveBeenCalledTimes(3);
        // It should use the absolute unformatted file paths to compare them with
        // the modified files.
        expect(modifiedFiles.has).toHaveBeenCalledWith('cwd/actionOptionWorkingDirectory/lib/file_0.dart');
        expect(modifiedFiles.has).toHaveBeenCalledWith('cwd/actionOptionWorkingDirectory/lib/file_1.dart');
        expect(modifiedFiles.has).toHaveBeenCalledWith('cwd/actionOptionWorkingDirectory/lib/file_2.dart');
        // It should use the relative unformatted file paths to compare them with
        // the ignored files.
        expect(ignoredFiles.has).toHaveBeenCalledWith('lib/file_0.dart');
        expect(ignoredFiles.has).toHaveBeenCalledWith('lib/file_1.dart');
        expect(ignoredFiles.has).toHaveBeenCalledWith('lib/file_2.dart');
    });
    it('should skip it if format is disabled', async () => {
        const actionOptions = {
            format: false,
        };
        const ignoredFiles = {};
        const modifiedFiles = {};
        const result = await format({
            modifiedFiles: modifiedFiles,
            ignoredFiles: ignoredFiles,
            actionOptions: actionOptions,
        });
        expect(result.success).toEqual(true);
        expect(result.count).toEqual(0); // It should succeed because format is disabled.
    });
    it('should use the provided format lines', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => { });
        const actionOptions = {
            format: true,
            workingDirectory: 'cwd/actionOptionWorkingDirectory',
            failOn: FailOnEnum.Format,
            formatLines: [
                'Changed lib/file_0.dart',
                'Changed lib/file_1.dart',
                'Changed lib/file_2.dart',
            ],
        };
        const ignoredFiles = {
            has: vi.fn(),
        };
        const modifiedFiles = {
            has: vi.fn(),
        };
        ignoredFiles.has.mockReturnValue(false);
        modifiedFiles.has.mockImplementation((file) => {
            return [
                'cwd/actionOptionWorkingDirectory/lib/file_0.dart',
                'cwd/actionOptionWorkingDirectory/lib/file_1.dart',
            ].includes(file);
        });
        const result = await format({
            modifiedFiles: modifiedFiles,
            ignoredFiles: ignoredFiles,
            actionOptions: actionOptions,
        });
        expect(result.success).toEqual(false); // It should fail because some modified files are not formatted.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(result.files).toEqual(new Set(['lib/file_0.dart', 'lib/file_1.dart'])); // It should return the unformatted files.
    });
});
//# sourceMappingURL=Format.test.js.map