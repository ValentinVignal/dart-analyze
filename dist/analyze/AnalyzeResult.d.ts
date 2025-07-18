import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
import { ParsedLine } from './ParsedLine.js';
export interface AnalyzeResultCountsInterface {
    info: number;
    warnings: number;
    errors: number;
}
/**
 * Different log counts from the dart Analyze
 */
declare class AnalyzeResultCounts {
    private readonly actionOptions;
    info: number;
    warnings: number;
    errors: number;
    constructor(params: AnalyzeResultCountsInterface, actionOptions: ActionOptionsSafe);
    /**
     * The total number of logs
     */
    get total(): number;
    get failCount(): number;
}
/**
 * Result of dart analyze
 */
export interface AnalyzeResultInterface {
    counts: AnalyzeResultCountsInterface;
    lines: ParsedLine[];
}
export declare class AnalyzeResult {
    private readonly actionOptions;
    counts: AnalyzeResultCounts;
    lines: ParsedLine[];
    constructor(params: AnalyzeResultInterface, actionOptions: ActionOptionsSafe);
    /**
     * Whether it is a success (not failing results)
     */
    get success(): boolean;
    /**
     * Whether it has logs (even not failing ones)
     */
    get hasWarning(): boolean;
    /**
     * Get the comment body
     */
    get commentBody(): string;
}
export {};
//# sourceMappingURL=AnalyzeResult.d.ts.map