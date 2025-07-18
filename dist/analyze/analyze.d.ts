import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
import { ModifiedFiles } from '../utils/ModifiedFiles.js';
import { AnalyzeResult } from './AnalyzeResult.js';
/**
 * Runs `dart analyze`
 *
 * @param params
 * @returns The result of `dart analyze`
 */
export declare function analyze(params: {
    modifiedFiles: ModifiedFiles;
    actionOptions: ActionOptionsSafe;
}): Promise<AnalyzeResult>;
//# sourceMappingURL=analyze.d.ts.map