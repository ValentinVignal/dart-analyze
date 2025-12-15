import path from 'path';
import {
  DartAnalyzeLogType,
  type DartAnalyzeLogTypeEnum,
} from '../analyze/DartAnalyzeLogType.js';
import { FailOn, FailOnEnum } from './FailOn.js';
import {
  getInputMultilineString,
  getInputNumber,
  getInputString,
} from './getInput.js';

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
   * Whether to fail on format issues.
   *
   * Defaults to `true`.
   */
  failOnFormat: boolean;

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

  /**
   * Severity overrides for specific rules.
   *
   *
   */
  severityOverrides: Map<string, DartAnalyzeLogTypeEnum>;
};

/**
 * Contains all the options of the action.
 */
export type ActionOptions = Partial<ActionOptionsSafe>;

// ...existing code...

/**
 * Parses severity overrides from input.
 * Supports both multiline format (one per line) and inline format (comma-separated).
 *
 * Examples:
 * - Multiline: "rule1: error\nrule2: warning\nrule3: info\nrule4: note"
 * - Inline: "rule1: error, rule2: warning, rule3: info, rule4: note"
 */
export const getSeverityOverrides = (): Map<string, DartAnalyzeLogTypeEnum> => {
  const input = getInputString('severity-overrides');

  const map = new Map<string, DartAnalyzeLogTypeEnum>();
  if (!input) {
    return map;
  }

  // Split by newlines first, then by commas for inline format
  const entries = input.includes('\n') ? input.split('\n') : input.split(',');

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const [key, value] = trimmed.split(':').map((part) => part.trim());
    if (!key || !value) {
      throw new Error(
        `Invalid format for severity-overrides: "${entry}". Expected format: "key: value"`,
      );
    }

    const valueEnum = DartAnalyzeLogType.typeFromString(value);

    map.set(key, valueEnum);
  }

  return map;
};

/**
 * Applies the default values to the action options.
 *
 * @param options
 * @returns
 */
export const applyDefaults = (options?: ActionOptions): ActionOptionsSafe => {
  const token = options?.token || getInputString('token');
  if (!token) {
    throw new Error('The token is required');
  }
  return {
    failOn: options?.failOn ?? FailOn.fromInput(getInputString('fail-on')),
    failOnFormat:
      options?.failOnFormat ??
      (getInputString('fail-on-format') || 'true') === 'true',
    workingDirectory: path.resolve(
      process.env.GITHUB_WORKSPACE!,
      options?.workingDirectory ?? getInputString('working-directory') ?? './',
    ),
    token,
    checkRenamedFiles:
      options?.checkRenamedFiles ??
      getInputString('check-renamed-files') === 'true',
    emojis: options?.emojis ?? (getInputString('emojis') || 'true') === 'true',
    format: options?.format ?? (getInputString('format') || 'true') === 'true',
    lineLength: options?.lineLength ?? getInputNumber('line-length'),
    analyzerLines:
      options?.analyzerLines ?? getInputMultilineString('analyzer-lines'),
    formatLines:
      options?.formatLines ?? getInputMultilineString('format-lines'),
    severityOverrides: options?.severityOverrides ?? getSeverityOverrides(),
  };
};
