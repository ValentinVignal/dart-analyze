import type { ActionOptions, ActionOptionsSafe } from './ActionOptions.js';
interface FileLinesInterface {
    start: number;
    end: number;
}
/**
 * Modified lines chunk of a file.
 */
declare class FileLines {
    readonly start: number;
    readonly end: number;
    constructor(params: FileLinesInterface);
    includes(line: number): boolean;
}
export interface ModifiedFileInterface {
    name: string;
    additions: FileLinesInterface[];
}
/**
 * A modified file
 */
export declare class ModifiedFile {
    private readonly actionOptions;
    /**
     * The file name from the root directory (`'lib/src/...'`).
     */
    readonly name: string;
    readonly additions: FileLines[];
    constructor(file: {
        filename: string;
        patch?: string | undefined;
    }, actionOptions: ActionOptions);
    /**
     * Parse the patch from github and properly set the objects attributes
     *
     * @param patch The patch from Github
     */
    private parsePatch;
    /**
     * Whether the file has addition
     */
    get hasAdditions(): boolean;
    /**
     * Check if a line is an addition of the file
     *
     * @param line
     * @returns true if the line number is included in the added lines
     */
    hasAdditionLine(line: number): boolean;
}
/**
 * All modified files
 */
export declare class ModifiedFiles {
    private readonly actionOptions;
    readonly files: Map<ModifiedFile['name'], ModifiedFile>;
    /**
     * Wait for this variable to be sure all the files has been loaded
     */
    readonly isInit: Promise<boolean>;
    private readonly _resolveInit;
    constructor(actionOptions: ActionOptionsSafe);
    /**
     * Init the class
     */
    private init;
    /**
     * Get the modified files
     *
     * @returns
     */
    private getGithubFiles;
    /**
     * Check whether a file is modified.
     *
     * This needs to be the absolute path of the file (`'/home/runner/work/...'`).
     *
     * @param fileName
     * @returns `true` if {@link fileName} is a modified file.
     */
    has(fileName: string): boolean;
    /**
     * Get the modified file
     *
     * @param fileName
     * @returns The modified file if it has been modified
     */
    get(fileName: string): ModifiedFile | undefined;
}
export {};
//# sourceMappingURL=ModifiedFiles.d.ts.map