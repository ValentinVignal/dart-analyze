import * as exec from '@actions/exec';
import { ModifiedFiles } from '../utils/ModifiedFiles.js';
import { AnalyzeResult } from './AnalyzeResult.js';
import { DartAnalyzeLogType, DartAnalyzeLogTypeEnum, } from './DartAnalyzeLogType.js';
import { ParsedLine } from './ParsedLine.js';
import { delimiter } from './delimiter.js';
/**
 * Runs `dart analyze`
 *
 * @param params
 * @returns The result of `dart analyze`
 */
export async function analyze(params) {
    let outputs = '';
    let errOutputs = '';
    console.log('::group:: Analyze dart code');
    let analyzerLines = params.actionOptions.analyzerLines;
    if (!analyzerLines) {
        const options = {
            cwd: params.actionOptions.workingDirectory,
        };
        options.listeners = {
            stdout: (data) => {
                outputs += data.toString();
            },
            stderr: (data) => {
                errOutputs += data.toString();
            },
        };
        const args = [params.actionOptions.workingDirectory];
        try {
            await exec.exec('dart analyze --format machine', args, options);
        }
        catch (_) {
            // dart analyze sometimes fails
        }
        const lines = outputs.trim().split(/\r?\n/);
        const errLines = errOutputs.trim().split(/\r?\n/);
        analyzerLines = [...lines, ...errLines];
    }
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    const parsedLines = [];
    for (const line of analyzerLines) {
        if (!line.includes(delimiter)) {
            continue;
        }
        try {
            const parsedLine = new ParsedLine({
                line,
            }, params.actionOptions);
            if (!params.modifiedFiles.has(parsedLine.file)) {
                // Don't lint anything if the file is not part of the changes
                continue;
            }
            console.log('analyze()', 'modifiedFiles.has(parsedLine.file)');
            const modifiedFile = params.modifiedFiles.get(parsedLine.file);
            if (!modifiedFile.hasAdditionLine(parsedLine.line)) {
                // Don't lint if the issue doesn't belong to the additions
                continue;
            }
            console.log('analyze()', 'modifiedFile.hasAdditionLine(parsedLine.line)');
            parsedLines.push(parsedLine);
            let urls = parsedLine.urls.join(' or ');
            const message = `file=${parsedLine.file},line=${parsedLine.line},col=${parsedLine.column}::${parsedLine.message}. See ${urls}`;
            switch (parsedLine.type) {
                case DartAnalyzeLogTypeEnum.Error:
                    errorCount++;
                    break;
                case DartAnalyzeLogTypeEnum.Warning:
                    warningCount++;
                    break;
                default:
                    infoCount++;
                    break;
            }
            console.log(`::${DartAnalyzeLogType.keyFromType(parsedLine.type)} ${message}`); // Log the issue
        }
        catch (error) {
            // This is not a log line
        }
    }
    console.log('::endgroup::');
    return new AnalyzeResult({
        counts: {
            info: infoCount,
            warnings: warningCount,
            errors: errorCount,
        },
        lines: parsedLines,
    }, params.actionOptions);
}
//# sourceMappingURL=analyze.js.map