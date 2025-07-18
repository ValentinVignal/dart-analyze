import path from 'path';
import { FailOnEnum } from '../utils/FailOn.js';
import { DartAnalyzeLogType, DartAnalyzeLogTypeEnum, } from './DartAnalyzeLogType.js';
import { delimiter } from './delimiter.js';
/**
 * Represents a parsed line from the `dart analyze --format machine` output.
 */
export class ParsedLine {
    actionOptions;
    /**
     * The file where the issue was found.
     */
    file;
    /**
     * The line number where the issue was found.
     */
    line;
    /**
     * The column number where the issue was found.
     */
    column;
    /**
     * The message of the issue.
     */
    message;
    /**
     * The URLs associated with the issue.
     */
    urls;
    /**
     * The type of the issue.
     */
    type;
    /**
     * The original line from the `dart analyze --format machine` output.
     */
    originalLine;
    /**
     * The id of the lint that was triggered.
     */
    lintName;
    constructor(params, actionOptions) {
        this.actionOptions = actionOptions;
        this.originalLine = params.line; // 'INFO|LINT|PREFER_CONST_CONSTRUCTORS|/path/to/file.dart|96|13|80|Prefer const with constant constructors.'
        const lineData = params.line.split(delimiter); // ['INFO', 'LINT', 'PREFER_CONST_CONSTRUCTORS', '/path/to/file.dart', '96', '13', '80', 'Prefer const with constant constructors.']
        this.type = DartAnalyzeLogType.typeFromKey(lineData[0]);
        this.message = lineData[7]; // 'Prefer const with constant constructors.'
        this.file = path.join(lineData[3]); // '/path/to/file.dart'
        const lineNumber = lineData[4]; // '96'
        const columnNumber = lineData[5]; // '13'
        const lintName = lineData[2].toLowerCase(); // 'PREFER_CONST_CONSTRUCTORS'
        this.lintName = lintName.toLowerCase(); // 'prefer_const_constructors'
        this.urls = [
            `https://dart.dev/diagnostic/${this.lintName}`,
            `https://dart.dev/lints/${this.lintName}`,
        ];
        this.line = parseInt(lineNumber);
        this.column = parseInt(columnNumber);
    }
    /**
     * Checks if the line is a valid Dart analyze log line.
     */
    get isFail() {
        if (this.actionOptions.failOn !== FailOnEnum.Nothing) {
            if (this.type === DartAnalyzeLogTypeEnum.Error) {
                return true;
            }
            if (this.actionOptions.failOn !== FailOnEnum.Error) {
                if (this.type === DartAnalyzeLogTypeEnum.Warning) {
                    return true;
                }
                if (this.actionOptions.failOn !== FailOnEnum.Warning) {
                    // It is FailOn.Info
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Returns the emoji associated with the log type.
     */
    get emoji() {
        switch (this.type) {
            case DartAnalyzeLogTypeEnum.Error:
                return ':bangbang:';
            case DartAnalyzeLogTypeEnum.Warning:
                return ':warning:';
            case DartAnalyzeLogTypeEnum.Info:
                return ':eyes:';
        }
    }
    /**
     * Returns the string representation of the log type.
     */
    get humanReadableString() {
        return `${DartAnalyzeLogType.typeToString(this.type)} - \`${path.relative(process.env.GITHUB_WORKSPACE, this.file)}\`:${this.line}:${this.column} - ${this.message} (${this.lintName}).`;
    }
}
//# sourceMappingURL=ParsedLine.js.map