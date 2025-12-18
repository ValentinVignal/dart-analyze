import type { ActionOptionsSafe } from '../utils/ActionOptions.js';

export interface FormatResultInterface {
  files: Set<string>;
}

export class FormatResult {
  private readonly files: Set<string>;

  constructor(
    private readonly actionOptions: ActionOptionsSafe,
    params?: FormatResultInterface,
  ) {
    this.files = params?.files ?? new Set<string>();
  }

  public get success(): boolean {
    return !this.actionOptions.failOnFormat || !this.files.size;
  }

  /**
   * Whether there are any format issues (even non-failing ones).
   */
  public get hasIssues(): boolean {
    return this.count > 0;
  }

  public get count(): number {
    return this.files.size;
  }

  public get commentBody(): string {
    const comments: string[] = [];
    const highlight = this.success ? '' : '**';
    for (const file of this.files) {
      comments.push(
        `- ${this.actionOptions.emojis ? ':poop: ' : ''} ${highlight}\`${file}\` is not formatted.${highlight}`,
      );
    }
    return comments.join('\n');
  }
}
