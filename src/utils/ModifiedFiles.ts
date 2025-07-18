import * as core from '@actions/core';
import * as github from '@actions/github';
import { context } from '@actions/github/lib/utils.js';
import path from 'path';
import type { EventName } from '../Actions/Github/EventName.js';
import type { ActionOptions, ActionOptionsSafe } from './ActionOptions.js';

interface FileLinesInterface {
  start: number;
  end: number;
}

/**
 * Modified lines chunk of a file.
 */
class FileLines {
  readonly start: number;
  readonly end: number;

  constructor(params: FileLinesInterface) {
    this.start = params.start;
    this.end = params.end;
  }

  public includes(line: number): boolean {
    return this.start <= line && line <= this.end;
  }
}

export interface ModifiedFileInterface {
  name: string;
  additions: FileLinesInterface[];
}

/**
 * A modified file
 */
export class ModifiedFile {
  /**
   * The file name from the root directory (`'lib/src/...'`).
   */
  readonly name: string;
  readonly additions: FileLines[];

  constructor(
    file: { filename: string; patch?: string | undefined },
    private readonly actionOptions: ActionOptions,
  ) {
    this.name = file.filename;
    this.additions = [];

    this.parsePatch(file.patch);
  }

  /**
   * Parse the patch from github and properly set the objects attributes
   *
   * @param patch The patch from Github
   */
  private parsePatch(patch?: string | undefined): void {
    if (patch) {
      // The changes are included in the file
      const patches = patch.split('@@').filter((_, index) => index % 2); // Only take the line information
      for (const patch of patches) {
        // patch is usually like " -6,7 +6,8"
        try {
          const hasAddition = patch.includes('+');
          if (hasAddition) {
            const lines = patch
              .match(/\+.*/)![0]
              .trim()
              .slice(1)
              .split(',')
              .map((num) => parseInt(num)) as [number, number];
            this.additions.push(
              new FileLines({
                start: lines[0],
                end: lines[0] + lines[1],
              }),
            );
          }
        } catch (error) {
          console.log(`Error getting the patch of the file:\n${error}`);
        }
      }
    } else if (this.actionOptions.checkRenamedFiles) {
      // Take the all file
      this.additions.push(
        new FileLines({
          start: 0,
          end: Infinity,
        }),
      );
    }
    console.log('ModifiedFile.parsePatch()', 'this.additions');
    console.log(
      this.additions.map((line) => ({ start: line.start, end: line.end })),
    );
  }

  /**
   * Whether the file has addition
   */
  public get hasAdditions(): boolean {
    return !!this.additions.length;
  }

  /**
   * Check if a line is an addition of the file
   *
   * @param line
   * @returns true if the line number is included in the added lines
   */
  public hasAdditionLine(line: number): boolean {
    if (!this.hasAdditions) {
      return false;
    }
    return this.additions.some((fileLines) => fileLines.includes(line));
  }
}

/**
 * All modified files
 */
export class ModifiedFiles {
  readonly files: Map<ModifiedFile['name'], ModifiedFile>;
  /**
   * Wait for this variable to be sure all the files has been loaded
   */
  readonly isInit: Promise<boolean>;
  private readonly _resolveInit: (value: boolean) => void;

  constructor(private readonly actionOptions: ActionOptionsSafe) {
    this.files = new Map<ModifiedFile['name'], ModifiedFile>();
    const resolveInit: ((value: boolean) => void)[] = [];
    let tempResolveInit: (value: boolean) => void;
    this.isInit = new Promise<boolean>((resolve) => {
      tempResolveInit = resolve;
    });
    this._resolveInit = tempResolveInit!;
    this.init();
  }

  /**
   * Init the class
   */
  private async init(): Promise<void> {
    const files = await this.getGithubFiles();
    console.log('ModifiedFiles.init()', 'Github files');
    console.log(files);
    for (const file of files) {
      console.log('ModifiedFiles.init()', 'file', file);
      this.files.set(
        path.join(process.env.GITHUB_WORKSPACE!, file.filename),
        new ModifiedFile(file, this.actionOptions),
      );
      const modifiedFile = new ModifiedFile(file, this.actionOptions);
      this.files.set(modifiedFile.name, modifiedFile);
    }
    console.log('ModifiedFiles.init()', 'this.files');
    console.log(this.files);
    this._resolveInit(true);
  }

  /**
   * Get the modified files
   *
   * @returns
   */
  private async getGithubFiles(): Promise<
    { filename: string; patch?: string | undefined }[]
  > {
    const eventName = github.context.eventName as EventName;
    let base = '';
    let head = '';

    switch (eventName) {
      case 'pull_request':
        base = github.context.payload.pull_request?.base?.sha;
        head = github.context.payload.pull_request?.head?.sha;
        break;
      case 'push':
        base = github.context.payload.before;
        head = github.context.payload.after;
        break;
      default:
        core.setFailed(
          `This action only supports pull requests and pushes, ${github.context.eventName} events are not supported. ` +
            "Please submit an issue on this action's GitHub repo if you believe this in correct.",
        );
    }

    /// Github client from API token
    const client = github.getOctokit(this.actionOptions.token);

    const response = await client.rest.repos.compareCommits({
      base,
      head,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    // Ensure that the request was successful.
    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
          "Please submit an issue on this action's GitHub repo.",
      );
    }
    return response.data.files!;
  }

  /**
   * Check whether a file is modified.
   *
   * This needs to be the absolute path of the file (`'/home/runner/work/...'`).
   *
   * @param fileName
   * @returns `true` if {@link fileName} is a modified file.
   */
  public has(fileName: string): boolean {
    if (fileName.includes('badge_widget.dart')) {
      console.log('ModifiedFiles.has()', 'fileName', fileName);
      console.log('ModifiedFiles.has()', 'this.files.keys()', [
        ...this.files.keys(),
      ]); // Debugging line
    }
    return this.files.has(fileName);
  }

  /**
   * Get the modified file
   *
   * @param fileName
   * @returns The modified file if it has been modified
   */
  public get(fileName: string): ModifiedFile | undefined {
    return this.files.get(fileName);
  }
}
