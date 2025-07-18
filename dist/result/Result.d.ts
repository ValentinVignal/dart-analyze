import { AnalyzeResult } from '../analyze/AnalyzeResult.js';
import { FormatResult } from '../format/FormatResult.js';
import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
export interface ResultInterface {
    analyze: AnalyzeResult;
    format: FormatResult;
}
/**
 * Handle and summarize the results
 */
export declare class Result {
    private readonly actionOptions;
    analyze: AnalyzeResult;
    format: FormatResult;
    constructor(params: ResultInterface, actionOptions: ActionOptionsSafe);
    /**
     * Whether it is a success or not
     */
    get success(): boolean;
    /**
     * Put a comment on the PR
     */
    comment(): Promise<void>;
    /**
     * Summary of the analysis put in the comment and in the console
     *
     * @param params
     * @returns
     */
    private issueCountMessage;
    /**
     * Global title put in the comment or in the console at the end of the analysis.
     */
    private title;
    /**
     * Line title for a specific dart analysis category.
     */
    private titleLineAnalyze;
    /**
     * Line title for the formatting issues.
     *
     * @param params
     * @returns
     */
    private titleLineFormat;
    /**
     * Log the results in the github action
     */
    log(): void;
    /**
     *
     * @param count
     * @returns 's' if count > 1, else ''
     */
    private static pluralS;
    /**
     * The total count of issues found.
     */
    private get count();
}
//# sourceMappingURL=Result.d.ts.map