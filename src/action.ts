import * as core from '@actions/core';
import { analyze } from './analyze/analyze.js';
import { format } from './format/format.js';
import { Result } from './result/Result.js';
import { IgnoredFiles } from './utils/IgnoredFiles.js';
import { ModifiedFiles } from './utils/ModifiedFiles.js';
import { applyDefaults, type ActionOptions } from './utils/ActionOptions.js';

/**
 * Run the action
 */
export async function run(options?: ActionOptions): Promise<void> {
  try {
    const optionsWithDefaults = applyDefaults(options);

    const modifiedFiles = new ModifiedFiles(optionsWithDefaults);

    await modifiedFiles.isInit;

    const ignoredFiles = new IgnoredFiles(optionsWithDefaults);

    const analyzeResult = await analyze({
      modifiedFiles,
      // `dart analyze` already doesn't check ignore files
      actionOptions: optionsWithDefaults,
    });

    const formatResult = await format({
      modifiedFiles,
      ignoredFiles,
      actionOptions: optionsWithDefaults,
    });

    const result = new Result(
      {
        analyze: analyzeResult,
        format: formatResult,
      },

      optionsWithDefaults,
    );

    await result.comment();
    result.log();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    core.setFailed(`error: ${error.message}`);
  }
}
