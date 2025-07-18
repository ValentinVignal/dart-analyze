import { IgnoredFiles } from '../utils/IgnoredFiles.js';
import { ModifiedFiles } from '../utils/ModifiedFiles.js';
import { FormatResult } from './FormatResult.js';
import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
export declare function format(params: {
    modifiedFiles: ModifiedFiles;
    ignoredFiles: IgnoredFiles;
    actionOptions: ActionOptionsSafe;
}): Promise<FormatResult>;
//# sourceMappingURL=format.d.ts.map