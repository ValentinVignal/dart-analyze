import { DartAnalyzeLogTypeEnum } from './DartAnalyzeLogType.js';
import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
/**
 * Represents a parsed line from the `dart analyze --format machine` output.
 */
export declare class ParsedLine {
    private readonly actionOptions;
    /**
     * The file where the issue was found.
     */
    readonly file: string;
    /**
     * The line number where the issue was found.
     */
    readonly line: number;
    /**
     * The column number where the issue was found.
     */
    readonly column: number;
    /**
     * The message of the issue.
     */
    readonly message: string;
    /**
     * The URLs associated with the issue.
     */
    readonly urls: [string, string];
    /**
     * The type of the issue.
     */
    readonly type: DartAnalyzeLogTypeEnum;
    /**
     * The original line from the `dart analyze --format machine` output.
     */
    readonly originalLine: string;
    /**
     * The id of the lint that was triggered.
     */
    readonly lintName: string;
    constructor(params: {
        line: string;
    }, actionOptions: ActionOptionsSafe);
    /**
     * Checks if the line is a valid Dart analyze log line.
     */
    get isFail(): boolean;
    /**
     * Returns the emoji associated with the log type.
     */
    get emoji(): string;
    /**
     * Returns the string representation of the log type.
     */
    get humanReadableString(): string;
}
//# sourceMappingURL=ParsedLine.d.ts.map