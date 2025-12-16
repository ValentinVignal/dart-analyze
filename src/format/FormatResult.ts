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

  public get count(): number {
    return this.files.size;
  }

  public get commentBody(): string {
    const comments: string[] = [];
    for (const file of this.files) {
      comments.push(
        `- ${this.actionOptions.emojis ? ':poop: ' : ''} \`${file}\` is not formatted.`,
      );
    }
    return comments.join('\n');
  }
}
