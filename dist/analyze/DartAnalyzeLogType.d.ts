import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
export declare enum DartAnalyzeLogTypeEnum {
    Info = 1,
    Warning = 2,
    Error = 3
}
/**
 * Represents the key of a Dart analyze log type.
 * This is used to identify the type of log in the `dart analyze` output.
 */
export type DartAnalyzeLogTypeKey = 'INFO' | 'WARNING' | 'ERROR';
export type LogKey = 'WARNING' | 'ERROR';
/**
 * Represents the type of a Dart analyze log.
 */
export declare class DartAnalyzeLogType {
    static typeFromKey(key: DartAnalyzeLogTypeKey): DartAnalyzeLogTypeEnum;
    /**
     *
     * @param logType
     * @returns The Github key for the log type.
     */
    static keyFromType(logType: DartAnalyzeLogTypeEnum): LogKey;
    /**
     * Checks if the log type should cause the action to fail.
     */
    static isFail(actionOptions: ActionOptionsSafe, logType: DartAnalyzeLogTypeEnum): boolean;
    /**
     * Converts the log type to a string.
     */
    static typeToString(logType: DartAnalyzeLogTypeEnum): string;
}
//# sourceMappingURL=DartAnalyzeLogType.d.ts.map