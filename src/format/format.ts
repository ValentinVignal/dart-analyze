import * as exec from '@actions/exec';
import * as path from 'path';
import { IgnoredFiles } from '../utils/IgnoredFiles.js';
import { ModifiedFiles } from '../utils/ModifiedFiles.js';
import { FormatResult } from './FormatResult.js';
import type { ActionOptionsSafe } from '../utils/ActionOptions.js';

export async function format(params: {
  modifiedFiles: ModifiedFiles;
  ignoredFiles: IgnoredFiles;
  actionOptions: ActionOptionsSafe;
}): Promise<FormatResult> {
  if (!params.actionOptions.format) {
    return new FormatResult(params.actionOptions);
  }
  let formatLines = params.actionOptions.formatLines;
  if (!formatLines) {
    let output = '';
    let errOutputs = '';

    console.log('::group:: Analyze formatting');

    const options: exec.ExecOptions = {
      cwd: params.actionOptions.workingDirectory,
    };
    options.listeners = {
      stdout: (data) => {
        output += data.toString();
      },
      stderr: (data) => {
        errOutputs += data.toString();
      },
    };

    const args: string[] = ['-o', 'none'];
    if (params.actionOptions.lineLength) {
      args.push('--line-length');
      args.push(params.actionOptions.lineLength.toString());
    }
    args.push('.');

    try {
      await exec.exec('dart format', args, options);
    } catch (_) {
      // Do nothing.
    }

    const lines = output.trim().split(/\r?\n/);
    const errLines = errOutputs.trim().split(/\r?\n/);
    formatLines = [...lines, ...errLines];
  }

  const fileNotFormatted = new Set<string>();

  for (const line of formatLines) {
    if (!line.startsWith('Changed')) {
      continue;
    }

    const file = line.split(' ')[1]!;
    // There is not need to use the `currentWorkingDirectory` here because the
    // `ignoredFiles` a minimatch from the working directory.
    if (params.ignoredFiles.has(file)) {
      continue;
    }
    if (
      params.modifiedFiles.has(
        path.join(params.actionOptions.workingDirectory, file),
      )
    ) {
      fileNotFormatted.add(file);
      console.log(`::warning file=${file}:: ${file} is not formatted`);
    }
  }
  console.log('::endgroup::');

  return new FormatResult(params.actionOptions, {
    files: fileNotFormatted,
  });
}
