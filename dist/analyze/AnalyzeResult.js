import { FailOnEnum } from '../utils/FailOn.js';
import { ParsedLine } from './ParsedLine.js';
/**
 * Different log counts from the dart Analyze
 */
class AnalyzeResultCounts {
    actionOptions;
    info;
    warnings;
    errors;
    constructor(params, actionOptions) {
        this.actionOptions = actionOptions;
        this.info = params.info;
        this.warnings = params.warnings;
        this.errors = params.errors;
    }
    /**
     * The total number of logs
     */
    get total() {
        return this.info + this.warnings + this.errors;
    }
    get failCount() {
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
export class AnalyzeResult {
    actionOptions;
    counts;
    lines;
    constructor(params, actionOptions) {
        this.actionOptions = actionOptions;
        this.counts = new AnalyzeResultCounts(params.counts, actionOptions);
        this.lines = params.lines;
    }
    /**
     * Whether it is a success (not failing results)
     */
    get success() {
        return !this.counts.failCount;
    }
    /**
     * Whether it has logs (even not failing ones)
     */
    get hasWarning() {
        return !!this.counts.total;
    }
    /**
     * Get the comment body
     */
    get commentBody() {
        const comments = [];
        for (const line of this.lines) {
            const urls = `See [link](${line.urls[0]}) or [link](${line.urls[1]}).`;
            let failEmoji = '';
            if (![FailOnEnum.Nothing, FailOnEnum.Format, FailOnEnum.Info].includes(this.actionOptions.failOn)) {
                failEmoji = `:${line.isFail ? 'x' : 'poop'}: `;
            }
            const highlight = line.isFail ? '**' : '';
            comments.push(`- ${this.actionOptions.emojis ? failEmoji + line.emoji + ' ' : ''}${highlight}${line.humanReadableString}${highlight} ${urls}`);
        }
        return comments.join('\n');
    }
}
//# sourceMappingURL=AnalyzeResult.js.map