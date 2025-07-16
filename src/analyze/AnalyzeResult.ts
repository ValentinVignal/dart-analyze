import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
import { FailOnEnum } from '../utils/FailOn.js';
import { ParsedLine } from './ParsedLine.js';

export interface AnalyzeResultCountsInterface {
  info: number;
  warnings: number;
  errors: number;
}

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
  lines: ParsedLine[];
}

export class AnalyzeResult {
  counts: AnalyzeResultCounts;
  lines: ParsedLine[];

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
      const urls = `See [link](${line.urls[0]}) or [link](${line.urls[1]}).`;
      let failEmoji = '';
      if (
        ![FailOnEnum.Nothing, FailOnEnum.Format, FailOnEnum.Info].includes(
          this.actionOptions.failOn,
        )
      ) {
        failEmoji = `:${line.isFail ? 'x' : 'poop'}: `;
      }
      const highlight = line.isFail ? '**' : '';
      comments.push(
        `- ${this.actionOptions.emojis ? failEmoji + line.emoji + ' ' : ''}${highlight}${line.humanReadableString}${highlight} ${urls}`,
      );
    }
    return comments.join('\n');
  }
}
