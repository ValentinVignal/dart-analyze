import { FailOnEnum } from '../utils/FailOn.js';
export class FormatResult {
    actionOptions;
    files;
    constructor(actionOptions, params) {
        this.actionOptions = actionOptions;
        this.files = params?.files ?? new Set();
    }
    get success() {
        return this.actionOptions.failOn !== FailOnEnum.Format || !this.files.size;
    }
    get count() {
        return this.files.size;
    }
    get commentBody() {
        const comments = [];
        for (const file of this.files) {
            comments.push(`- ${this.actionOptions.emojis ? ':poop: ' : ''} \`${file}\` is not formatted.`);
        }
        return comments.join('\n');
    }
}
//# sourceMappingURL=FormatResult.js.map