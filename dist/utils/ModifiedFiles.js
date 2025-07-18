import * as core from '@actions/core';
import * as github from '@actions/github';
import { context } from '@actions/github/lib/utils.js';
import path from 'path';
/**
 * Modified lines chunk of a file.
 */
class FileLines {
    start;
    end;
    constructor(params) {
        this.start = params.start;
        this.end = params.end;
    }
    includes(line) {
        return this.start <= line && line <= this.end;
    }
}
/**
 * A modified file
 */
export class ModifiedFile {
    actionOptions;
    /**
     * The file name from the root directory (`'lib/src/...'`).
     */
    name;
    additions;
    constructor(file, actionOptions) {
        this.actionOptions = actionOptions;
        this.name = file.filename;
        this.additions = [];
        this.parsePatch(file.patch);
    }
    /**
     * Parse the patch from github and properly set the objects attributes
     *
     * @param patch The patch from Github
     */
    parsePatch(patch) {
        if (patch) {
            // The changes are included in the file
            const patches = patch.split('@@').filter((_, index) => index % 2); // Only take the line information
            for (const patch of patches) {
                // patch is usually like " -6,7 +6,8"
                try {
                    const hasAddition = patch.includes('+');
                    if (hasAddition) {
                        const lines = patch
                            .match(/\+.*/)[0]
                            .trim()
                            .slice(1)
                            .split(',')
                            .map((num) => parseInt(num));
                        this.additions.push(new FileLines({
                            start: lines[0],
                            end: lines[0] + lines[1],
                        }));
                    }
                }
                catch (error) {
                    console.log(`Error getting the patch of the file:\n${error}`);
                }
            }
        }
        else if (this.actionOptions.checkRenamedFiles) {
            // Take the all file
            this.additions.push(new FileLines({
                start: 0,
                end: Infinity,
            }));
        }
        console.log('ModifiedFile.parsePatch()', 'this.additions');
        console.log(this.additions.map((line) => ({ start: line.start, end: line.end })));
    }
    /**
     * Whether the file has addition
     */
    get hasAdditions() {
        return !!this.additions.length;
    }
    /**
     * Check if a line is an addition of the file
     *
     * @param line
     * @returns true if the line number is included in the added lines
     */
    hasAdditionLine(line) {
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
    actionOptions;
    files;
    /**
     * Wait for this variable to be sure all the files has been loaded
     */
    isInit;
    _resolveInit;
    constructor(actionOptions) {
        this.actionOptions = actionOptions;
        this.files = new Map();
        const resolveInit = [];
        let tempResolveInit;
        this.isInit = new Promise((resolve) => {
            tempResolveInit = resolve;
        });
        this._resolveInit = tempResolveInit;
        this.init();
    }
    /**
     * Init the class
     */
    async init() {
        const files = await this.getGithubFiles();
        console.log('ModifiedFiles.init()', 'Github files');
        console.log(files);
        for (const file of files) {
            console.log('ModifiedFiles.init()', 'file', file);
            this.files.set(path.join(process.env.GITHUB_WORKSPACE, file.filename), new ModifiedFile(file, this.actionOptions));
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
    async getGithubFiles() {
        const eventName = github.context.eventName;
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
                core.setFailed(`This action only supports pull requests and pushes, ${github.context.eventName} events are not supported. ` +
                    "Please submit an issue on this action's GitHub repo if you believe this in correct.");
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
            core.setFailed(`The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
                "Please submit an issue on this action's GitHub repo.");
        }
        return response.data.files;
    }
    /**
     * Check whether a file is modified.
     *
     * This needs to be the absolute path of the file (`'/home/runner/work/...'`).
     *
     * @param fileName
     * @returns `true` if {@link fileName} is a modified file.
     */
    has(fileName) {
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
    get(fileName) {
        return this.files.get(fileName);
    }
}
//# sourceMappingURL=ModifiedFiles.js.map