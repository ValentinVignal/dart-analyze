import path from 'path';
import { FailOnEnum } from '../utils/FailOn.js';
import {
  DartAnalyzeLogType,
  DartAnalyzeLogTypeEnum,
  type DartAnalyzeLogTypeKey,
} from './DartAnalyzeLogType.js';
import { delimiter } from './delimiter.js';
import type { ActionOptionsSafe } from '../utils/ActionOptions.js';

/**
 * Represents a parsed line from the `dart analyze --format machine` output.
 */
export class ParsedLine {
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

  constructor(
    params: { line: string },
    private readonly actionOptions: ActionOptionsSafe,
  ) {
    this.originalLine = params.line; // 'INFO|LINT|PREFER_CONST_CONSTRUCTORS|/path/to/file.dart|96|13|80|Prefer const with constant constructors.'
    const lineData = params.line.split(delimiter); // ['INFO', 'LINT', 'PREFER_CONST_CONSTRUCTORS', '/path/to/file.dart', '96', '13', '80', 'Prefer const with constant constructors.']
    this.type = DartAnalyzeLogType.typeFromKey(
      lineData[0] as DartAnalyzeLogTypeKey,
    );
    this.message = lineData[7]!; // 'Prefer const with constant constructors.'
    this.file = path.join(lineData[3]!); // '/path/to/file.dart'
    const lineNumber = lineData[4]!; // '96'
    const columnNumber = lineData[5]!; // '13'
    const lintName = lineData[2]!.toLowerCase(); // 'PREFER_CONST_CONSTRUCTORS'
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
  public get isFail(): boolean {
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
  public get emoji(): string {
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
  public get humanReadableString(): string {
    return `${DartAnalyzeLogType.typeToString(this.type)} - \`${path.relative(process.env.GITHUB_WORKSPACE!, this.file)}\`:${this.line}:${this.column} - ${this.message} (${this.lintName}).`;
  }
}
