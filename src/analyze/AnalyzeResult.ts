import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
import { FailOnEnum } from '../utils/FailOn.js';
import type { ModifiedFile } from '../utils/ModifiedFiles.js';
import { DartAnalyzeLogType } from './DartAnalyzeLogType.js';
import { ParsedLine } from './ParsedLine.js';

export interface AnalyzeResultCountsInterface {
  info: number;
  warnings: number;
  errors: number;
}

export type AnalyzeResultLine = {
  line: ParsedLine;
  file: ModifiedFile;
};

/**
 * Different log counts from the dart Analyze
 */
class AnalyzeResultCounts {
  info: number;
  warnings: number;
  errors: number;
  constructor(
    params: AnalyzeResultCountsInterface,
    private readonly actionOptions: ActionOptionsSafe,
  ) {
    this.info = params.info;
    this.warnings = params.warnings;
    this.errors = params.errors;
  }

  /**
   * The total number of logs
   */
  public get total(): number {
    return this.info + this.warnings + this.errors;
  }

  public get failCount(): number {
    let count = 0;
    if (this.actionOptions.failOn !== FailOnEnum.Nothing) {
      count += this.errors;
      if (this.actionOptions.failOn !== FailOnEnum.Error) {
        count += this.warnings;
        if (this.actionOptions.failOn !== FailOnEnum.Warning) {
          count += this.info;
        }
      }
    }
    return count;
  }
}

/**
 * Result of dart analyze
 */
export interface AnalyzeResultInterface {
  counts: AnalyzeResultCountsInterface;
  lines: AnalyzeResultLine[];
}

export class AnalyzeResult {
  counts: AnalyzeResultCounts;
  lines: AnalyzeResultLine[];

  constructor(
    params: AnalyzeResultInterface,
    private readonly actionOptions: ActionOptionsSafe,
  ) {
    this.counts = new AnalyzeResultCounts(params.counts, actionOptions);
    this.lines = params.lines;
  }

  /**
   * Whether it is a success (not failing results)
   */
  public get success(): boolean {
    return !this.counts.failCount;
  }

  /**
   * Whether it has logs (even not failing ones)
   */
  public get hasWarning(): boolean {
    return !!this.counts.total;
  }

  /**
   * Get the comment body
   */
  public get commentBody(): string {
    const comments: string[] = [];

    for (const line of this.lines) {
      const urls = `See [link](${line.line.urls[0]}) or [link](${line.line.urls[1]}).`;
      let failEmoji = '';
      if (
        ![FailOnEnum.Nothing, FailOnEnum.Format, FailOnEnum.Info].includes(
          this.actionOptions.failOn,
        )
      ) {
        failEmoji = `:${line.line.isFail ? 'x' : 'poop'}: `;
      }
      const highlight = line.line.isFail ? '**' : '';
      const humanReadableString = `${DartAnalyzeLogType.typeToString(line.line.type)} - \`${line.file.name}\`:${line.line.line}:${line.line.column} - ${line.line.message} (${line.line.lintName}).`;
      comments.push(
        `- ${this.actionOptions.emojis ? failEmoji + line.line.emoji + ' ' : ''}${highlight}${humanReadableString}${highlight} ${urls}`,
      );
    }
    return comments.join('\n');
  }
}
