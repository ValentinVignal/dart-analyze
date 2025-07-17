import path from 'path';
import { FailOn, FailOnEnum } from './FailOn.js';
import type { PartiallyPartial } from './types.js';
import { getInputSafe } from './getInput.js';

/**
 * Contains all the options of the action.
 */
export type ActionOptionsSafe = {
  /**
   * The fail condition for the action.
   *
   * Default is {@link FailOnEnum.Warning}.
   */
  failOn: FailOnEnum;
  /**
   * The working directory of the action.
   */
  workingDirectory: string;
  /**
   * The GitHub token to use for the action.
   */
  token: string;
  /**
   * Whether to check renamed files.
   */
  checkRenamedFiles?: boolean;
  /**
   * Whether to use emojis in the output.
   */
  emojis: boolean;
  /**
   * Whether to check the format of the Dart code.
   *
   * Default is `true`.
   *
   * - If `false`, the action will not run `dart format` and {@link formatLines}
   * is ignored.
   * - If `false`, {@link lineLength} is ignored.
   */
  format: boolean;
  /**
   * The maximum length of a line in the Dart code.
   *
   * - If {@link format} is `false`, this is ignored.
   * - If {@link formatLines} is provided, this is ignored.
   */
  lineLength?: number | null;

  /**
   * The list of analyzer lines to check.
   *
   * If not provided, the action will run `dart analyze` to get them.
   */
  analyzerLines?: string[];

  /**
   * The list of files that were formatted.
   *
   * If not provided, the action will run `dart format` to get them.
   *
   * - This is ignored if {@link format} is `false`.
   * - If provided, {@link lineLength} will be ignored.
   */
  formatLines?: string[];
};

/**
 * Contains all the options of the action.
 */
export type ActionOptions = Partial<ActionOptionsSafe>;

/**
 * Applies the default values to the action options.
 *
 * @param options
 * @returns
 */
export const applyDefaults = (options: ActionOptions): ActionOptionsSafe => ({
  failOn: options.failOn ?? FailOn.fromInput(getInputSafe('fail-on')),
  workingDirectory: path.resolve(
    process.env.GITHUB_WORKSPACE!,
    options.workingDirectory ?? getInputSafe('working-directory') ?? './',
  ),
  token: options.token ?? getInputSafe('token', { required: true }),
  checkRenamedFiles:
    options.checkRenamedFiles ?? getInputSafe('check-renamed-files') === 'true',
  emojis: options.emojis ?? (getInputSafe('emojis') || 'true') === 'true',
  format: options.format ?? (getInputSafe('format') || 'true') === 'true',
  lineLength:
    options.lineLength || parseInt(getInputSafe('line-length')) || null,
  analyzerLines:
    options.analyzerLines ??
    getInputSafe('analyzer-lines').split('\n').filter(Boolean),
  formatLines:
    options.formatLines ??
    getInputSafe('format-lines').split('\n').filter(Boolean),
});
