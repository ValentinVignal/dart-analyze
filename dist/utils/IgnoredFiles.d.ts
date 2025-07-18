import type { ActionOptionsSafe } from './ActionOptions.js';
/**
 * The ignore files in the analysis_options.yaml
 */
export declare class IgnoredFiles {
    private readonly actionOptions;
    private readonly patterns;
    constructor(actionOptions: ActionOptionsSafe);
    /**
     *
     * @param path
     */
    private static findClosestYamlFile;
    private static getIgnoredPatterns;
    /**
     * Whether a file is ignored
     */
    has(file: string): boolean;
}
//# sourceMappingURL=IgnoredFiles.d.ts.map