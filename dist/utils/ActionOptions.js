import path from 'path';
import { FailOn, FailOnEnum } from './FailOn.js';
import { getInputSafe } from './getInput.js';
/**
 * Applies the default values to the action options.
 *
 * @param options
 * @returns
 */
export const applyDefaults = (options) => ({
    failOn: options.failOn ?? FailOn.fromInput(getInputSafe('fail-on')),
    workingDirectory: path.resolve(process.env.GITHUB_WORKSPACE, options.workingDirectory ?? getInputSafe('working-directory') ?? './'),
    token: options.token || getInputSafe('token'),
    checkRenamedFiles: options.checkRenamedFiles ?? getInputSafe('check-renamed-files') === 'true',
    emojis: options.emojis ?? (getInputSafe('emojis') || 'true') === 'true',
    format: options.format ?? (getInputSafe('format') || 'true') === 'true',
    lineLength: options.lineLength || parseInt(getInputSafe('line-length')) || null,
    analyzerLines: options.analyzerLines ??
        getInputSafe('analyzer-lines').split('\n').filter(Boolean),
    formatLines: options.formatLines ??
        getInputSafe('format-lines').split('\n').filter(Boolean),
});
//# sourceMappingURL=ActionOptions.js.map