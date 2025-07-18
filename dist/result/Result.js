import * as core from '@actions/core';
import { AnalyzeResult } from '../analyze/AnalyzeResult.js';
import { DartAnalyzeLogType, DartAnalyzeLogTypeEnum, } from '../analyze/DartAnalyzeLogType.js';
import { FormatResult } from '../format/FormatResult.js';
import { comment } from '../utils/comment.js';
import { FailOnEnum } from '../utils/FailOn.js';
/**
 * Handle and summarize the results
 */
export class Result {
    actionOptions;
    analyze;
    format;
    constructor(params, actionOptions) {
        this.actionOptions = actionOptions;
        /**
         * Dart analyze result
         */
        this.analyze = params.analyze;
        /**
         * Dart format result
         */
        this.format = params.format;
    }
    /**
     * Whether it is a success or not
     */
    get success() {
        return this.analyze.success && this.format.success;
    }
    /**
     * Put a comment on the PR
     */
    async comment() {
        const messages = [this.issueCountMessage({ emojis: true })];
        const analyzeBody = this.analyze.commentBody;
        if (analyzeBody) {
            messages.push(analyzeBody);
        }
        const formatBody = this.format.commentBody;
        if (formatBody) {
            messages.push(formatBody);
        }
        await comment({ message: messages.join('\n---\n') }, this.actionOptions);
    }
    /**
     * Summary of the analysis put in the comment and in the console
     *
     * @param params
     * @returns
     */
    issueCountMessage(params) {
        const messages = [
            this.title(params),
            this.titleLineAnalyze({
                ...params,
                type: DartAnalyzeLogTypeEnum.Error,
            }),
            this.titleLineAnalyze({
                ...params,
                type: DartAnalyzeLogTypeEnum.Warning,
            }),
            this.titleLineAnalyze({
                ...params,
                type: DartAnalyzeLogTypeEnum.Info,
            }),
        ];
        if (this.actionOptions.format) {
            messages.push(this.titleLineFormat({ ...params }));
        }
        return messages.join('\n');
    }
    /**
     * Global title put in the comment or in the console at the end of the analysis.
     */
    title(params) {
        const title = `Dart Analyzer found ${this.count} issue${Result.pluralS(this.count)}`;
        if (params?.emojis && this.actionOptions.emojis) {
            let emoji = ':tada:';
            if (this.analyze.counts.failCount) {
                emoji = ':x:';
            }
            else if (this.analyze.counts.total) {
                emoji = ':warning:';
            }
            return `${emoji} ${title}`;
        }
        else {
            return title;
        }
    }
    /**
     * Line title for a specific dart analysis category.
     */
    titleLineAnalyze(params) {
        const isFail = DartAnalyzeLogType.isFail(this.actionOptions, params.type);
        let emoji = '';
        let count;
        let line = '';
        switch (params.type) {
            case DartAnalyzeLogTypeEnum.Error:
                count = this.analyze.counts.errors;
                emoji = count ? 'x' : 'white_check_mark';
                line = `${count} error${Result.pluralS(count)}`;
                break;
            case DartAnalyzeLogTypeEnum.Warning:
                count = this.analyze.counts.warnings;
                emoji = count ? 'warning' : 'tada';
                line = `${count} warning${Result.pluralS(count)}`;
                break;
            case DartAnalyzeLogTypeEnum.Info:
                count = this.analyze.counts.info;
                emoji = count ? 'eyes' : 'rocket';
                line = `${count} info log${Result.pluralS(count)}`;
                break;
        }
        const highlight = isFail && params.emojis && count ? '**' : '';
        emoji = `:${emoji}: `;
        line = `- ${params.emojis && this.actionOptions.emojis ? emoji : ''}${highlight}${line}.${highlight}`;
        return line;
    }
    /**
     * Line title for the formatting issues.
     *
     * @param params
     * @returns
     */
    titleLineFormat(params) {
        const emoji = `:${this.format.count ? 'poop' : 'art'}: `;
        const highlight = params.emojis &&
            this.format.count &&
            this.actionOptions.failOn === FailOnEnum.Format
            ? '**'
            : '';
        return `- ${params.emojis && this.actionOptions.emojis ? emoji : ''}${highlight}${this.format.count} formatting issue${Result.pluralS(this.format.count)}${highlight}`;
    }
    /**
     * Log the results in the github action
     */
    log() {
        const logger = this.success
            ? this.count
                ? core.warning
                : core.info
            : core.setFailed;
        logger(this.issueCountMessage());
    }
    /**
     *
     * @param count
     * @returns 's' if count > 1, else ''
     */
    static pluralS(count) {
        return count > 1 ? 's' : '';
    }
    /**
     * The total count of issues found.
     */
    get count() {
        return this.analyze.counts.total + this.format.count;
    }
}
//# sourceMappingURL=Result.js.map