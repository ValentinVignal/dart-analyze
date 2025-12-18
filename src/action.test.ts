import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import type { WebhookPayload } from '@actions/github/lib/interfaces.js';
import { GitHub } from '@actions/github/lib/utils.js';
import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from './action.js';
import { DartAnalyzeLogTypeEnum } from './analyze/DartAnalyzeLogType.js';
import type { DeepPartial } from './utils/types.js';

vi.mock('@actions/github');
vi.mock('@actions/github/lib/utils.js');
vi.mock('@actions/core');
vi.mock('path');
vi.mock('fs');
vi.mock('@actions/exec');

describe('run', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    vi.clearAllMocks();

    process.env = { ...OLD_ENV };

    // Mock console.log
    vi.spyOn(console, 'log').mockReturnValue();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  it('should run the action with the default options', async () => {
    // Mock the environment variables representing the action inputs.
    process.env.INPUT_TOKEN = 'token';
    const workingDirectory = '/home/runner/work/repository/repository';
    process.env.GITHUB_WORKSPACE = workingDirectory;

    // Mock the Github API.
    vi.mocked(github.context).eventName = 'pull_request';
    vi.mocked(github.context).payload = {
      pull_request: {
        number: 123,
        base: { sha: 'base-sha' },
        head: { sha: 'head-sha' },
      },
    } as unknown as WebhookPayload;
    vi.spyOn(github.context, 'repo', 'get').mockReturnValue({
      owner: 'test-owner',
      repo: 'test-repo',
    });

    const octokit: DeepPartial<InstanceType<typeof GitHub>> = {
      rest: {
        repos: {
          compareCommitsWithBasehead: vi.fn().mockResolvedValue({
            status: 200,
            data: {
              files: [
                {
                  filename: 'lib/file1.dart',
                  patch: `
@@ -1,4 +1,6 @@
 import 'package:flutter/material.dart';

-void main() => runApp(MyApp());
+void main() {
+  runApp(MyApp());
+}

@@ -20,3 +20,5 @@
 class MyApp extends StatelessWidget {
-  Widget build(BuildContext context) => MaterialApp(home: Container());
+  Widget build(BuildContext context) {
+    return MaterialApp(home: Container());
+  }
 }
                  `,
                },

                {
                  filename: 'lib/file2.dart',
                  patch: `
@@ -50,4 +50,6 @@
 import 'package:flutter/material.dart';

-void main() => runApp(MyApp());
+void main() {
+  runApp(MyApp());
+}

@@ -200,3 +200,5 @@
 class MyApp extends StatelessWidget {
-  Widget build(BuildContext context) => MaterialApp(home: Container());
+  Widget build(BuildContext context) {
+    return MaterialApp(home: Container());
+  }
 }
                  `,
                },
              ],
            },
          }) as any,
        },
        issues: {
          listComments: vi.fn().mockResolvedValue({
            data: [],
          }) as any,
          createComment: vi.fn().mockResolvedValue({}) as any,
        },
      },
    };

    vi.mocked(github.getOctokit).mockReturnValue(
      octokit as InstanceType<typeof GitHub>,
    );

    // Mock the read of the yaml file.
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    vi.mocked(path.resolve).mockReturnValueOnce(workingDirectory);
    vi.mocked(path.resolve).mockReturnValueOnce(
      'path/to/analysis_options.yaml',
    );
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('');

    // Mock the exec.exec function.
    vi.mocked(exec.exec).mockImplementationOnce(
      async (command, args, options) => {
        const lines = [
          // SEVERITY|TYPE|ERROR_CODE|FILE_PATH|LINE|COLUMN|LENGTH|ERROR_MESSAGE
          'INFO|LINT|PREFER_CONST_CONSTRUCTORS|/path/to/file.dart|96|13|80|Prefer const with constant constructors.',
          // # File 1.
          // Info.
          'INFO|LINT|ERROR_CODE_0|lib/file1.dart|1|1|1|Info message for file 1, hunk 1.', // Included.
          'INFO|LINT|ERROR_CODE_1|lib/file1.dart|10|1|1|Ignored info message for file 1.',
          'INFO|LINT|ERROR_CODE_2|lib/file1.dart|20|1|1|Info message for file 1, hunk 2.', // Included.
          'INFO|LINT|ERROR_CODE_3|lib/file1.dart|50|1|1|Ignored info message for file 1.',
          // Warning.
          'WARNING|LINT|ERROR_CODE_4|lib/file1.dart|2|1|1|Warning message for file 1, hunk 1.', // Included.
          'WARNING|LINT|ERROR_CODE_5|lib/file1.dart|11|1|1|Ignored warning message for file 1.',
          'WARNING|LINT|ERROR_CODE_6|lib/file1.dart|21|1|1|Warning message for file 1, hunk 2.', // Included.
          'WARNING|LINT|ERROR_CODE_7|lib/file1.dart|51|1|1|Ignored warning message for file 1.',
          // Errors.
          'ERROR|LINT|ERROR_CODE_8|lib/file1.dart|3|1|1|Error message for file 1, hunk 1.', // Included.
          'ERROR|LINT|ERROR_CODE_9|lib/file1.dart|12|1|1|Ignored error message for file 1.',
          'ERROR|LINT|ERROR_CODE_10|lib/file1.dart|22|1|1|Error message for file 1, hunk 2.', // Included.
          'ERROR|LINT|ERROR_CODE_11|lib/file1.dart|52|1|1|Ignored error message for file 1.',

          // # File 2.
          // Info.
          'INFO|LINT|ERROR_CODE_12|lib/file2.dart|1|1|1|Ignored info message for file 2.',
          'INFO|LINT|ERROR_CODE_13|lib/file2.dart|50|1|1|Info message for file 2, hunk 1.', // Included.
          'INFO|LINT|ERROR_CODE_14|lib/file2.dart|100|1|1|Ignored info message for file 2.',
          'INFO|LINT|ERROR_CODE_15|lib/file2.dart|200|1|1|Info message for file 2, hunk 2.', // Included.
          'INFO|LINT|ERROR_CODE_16|lib/file2.dart|500|1|1|Ignored info message for file 2.',
          // Warning.
          'WARNING|LINT|ERROR_CODE_17|lib/file2.dart|2|1|1|Ignored warning message for file 2.',
          'WARNING|LINT|ERROR_CODE_18|lib/file2.dart|51|1|1|Warning message for file 2, hunk 1.', // Included.
          'WARNING|LINT|ERROR_CODE_19|lib/file2.dart|101|1|1|Ignored warning message for file 2.',
          'WARNING|LINT|ERROR_CODE_20|lib/file2.dart|201|1|1|Warning message for file 2, hunk 2.', // Included.
          'WARNING|LINT|ERROR_CODE_21|lib/file2.dart|501|1|1|Ignored warning message for file 2.',
          // Errors.
          'ERROR|LINT|ERROR_CODE_22|lib/file2.dart|3|1|1|Ignored error message for file 2.',
          'ERROR|LINT|ERROR_CODE_23|lib/file2.dart|52|1|1|Error message for file 2, hunk 1.', // Included.
          'ERROR|LINT|ERROR_CODE_24|lib/file2.dart|102|1|1|Ignored error message for file 2.',
          'ERROR|LINT|ERROR_CODE_25|lib/file2.dart|202|1|1|Error message for file 2, hunk 2.', // Included.
          'ERROR|LINT|ERROR_CODE_26|lib/file2.dart|502|1|1|Ignored error message for file 2.',
          // # File 3 (not modified).
          'INFO|LINT|ERROR_CODE_27|lib/file3.dart|1|1|1|Info message for file 3',
          'WARNING|LINT|ERROR_CODE_27|lib/file3.dart|2|1|1|Warning message for file 3',
          'ERROR|LINT|ERROR_CODE_27|lib/file3.dart|3|1|1|Error message for file 3',
        ];

        for (const line of lines) {
          options!.listeners!.stdout!(Buffer.from(line + '\n'));
        }
        return 0;
      },
    );
    vi.mocked(exec.exec).mockImplementationOnce(
      async (command, args, options) => {
        const lines = [
          'Changed lib/file1.dart',
          'Changed lib/file3.dart',
          'Formatted 10 files (2 changed) in 0.123s',
        ];

        for (const line of lines) {
          options!.listeners!.stdout!(Buffer.from(line + '\n'));
        }
        return 0;
      },
    );

    await run();

    expect(
      octokit.rest?.repos?.compareCommitsWithBasehead,
    ).toHaveBeenCalledExactlyOnceWith({
      basehead: 'base-sha...head-sha',
      owner: 'test-owner',
      repo: 'test-repo',
    });
    expect(exec.exec).toHaveBeenCalledWith(
      'dart analyze --format machine',
      [workingDirectory],
      expect.anything(),
    );
    expect(exec.exec).toHaveBeenCalledWith(
      'dart format',
      ['-o', 'none', '.'],
      expect.anything(),
    );
    expect(octokit.rest!.issues!.listComments).toHaveBeenCalledExactlyOnceWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 123,
    });
    expect(octokit.rest!.issues!.createComment).toHaveBeenCalledExactlyOnceWith(
      {
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        body: `<!-- dart-analyze -->
:x: Dart Analyzer found 13 issues
- :x: **4 errors.**
- :warning: **4 warnings.**
- :eyes: 4 info logs.
- :poop: **1 formatting issue.**
---
- :eyes: Info - \`lib/file1.dart\`:1:1 - Info message for file 1, hunk 1. (error_code_0). See [link](https://dart.dev/diagnostic/error_code_0) or [link](https://dart.dev/lints/error_code_0).
- :eyes: Info - \`lib/file1.dart\`:20:1 - Info message for file 1, hunk 2. (error_code_2). See [link](https://dart.dev/diagnostic/error_code_2) or [link](https://dart.dev/lints/error_code_2).
- :warning: **Warning - \`lib/file1.dart\`:2:1 - Warning message for file 1, hunk 1. (error_code_4).** See [link](https://dart.dev/diagnostic/error_code_4) or [link](https://dart.dev/lints/error_code_4).
- :warning: **Warning - \`lib/file1.dart\`:21:1 - Warning message for file 1, hunk 2. (error_code_6).** See [link](https://dart.dev/diagnostic/error_code_6) or [link](https://dart.dev/lints/error_code_6).
- :bangbang: **Error - \`lib/file1.dart\`:3:1 - Error message for file 1, hunk 1. (error_code_8).** See [link](https://dart.dev/diagnostic/error_code_8) or [link](https://dart.dev/lints/error_code_8).
- :bangbang: **Error - \`lib/file1.dart\`:22:1 - Error message for file 1, hunk 2. (error_code_10).** See [link](https://dart.dev/diagnostic/error_code_10) or [link](https://dart.dev/lints/error_code_10).
- :eyes: Info - \`lib/file2.dart\`:50:1 - Info message for file 2, hunk 1. (error_code_13). See [link](https://dart.dev/diagnostic/error_code_13) or [link](https://dart.dev/lints/error_code_13).
- :eyes: Info - \`lib/file2.dart\`:200:1 - Info message for file 2, hunk 2. (error_code_15). See [link](https://dart.dev/diagnostic/error_code_15) or [link](https://dart.dev/lints/error_code_15).
- :warning: **Warning - \`lib/file2.dart\`:51:1 - Warning message for file 2, hunk 1. (error_code_18).** See [link](https://dart.dev/diagnostic/error_code_18) or [link](https://dart.dev/lints/error_code_18).
- :warning: **Warning - \`lib/file2.dart\`:201:1 - Warning message for file 2, hunk 2. (error_code_20).** See [link](https://dart.dev/diagnostic/error_code_20) or [link](https://dart.dev/lints/error_code_20).
- :bangbang: **Error - \`lib/file2.dart\`:52:1 - Error message for file 2, hunk 1. (error_code_23).** See [link](https://dart.dev/diagnostic/error_code_23) or [link](https://dart.dev/lints/error_code_23).
- :bangbang: **Error - \`lib/file2.dart\`:202:1 - Error message for file 2, hunk 2. (error_code_25).** See [link](https://dart.dev/diagnostic/error_code_25) or [link](https://dart.dev/lints/error_code_25).
---
- :poop:  **\`lib/file1.dart\` is not formatted.**`,
      },
    );
    expect(vi.mocked(console.log).mock.calls).toEqual(
      [
        '::group:: Analyze dart code',
        '::NOTICE file=lib/file1.dart,line=1,col=1::Info message for file 1, hunk 1. (error_code_0) See https://dart.dev/diagnostic/error_code_0 or https://dart.dev/lints/error_code_0',
        '::NOTICE file=lib/file1.dart,line=20,col=1::Info message for file 1, hunk 2. (error_code_2) See https://dart.dev/diagnostic/error_code_2 or https://dart.dev/lints/error_code_2',
        '::WARNING file=lib/file1.dart,line=2,col=1::Warning message for file 1, hunk 1. (error_code_4) See https://dart.dev/diagnostic/error_code_4 or https://dart.dev/lints/error_code_4',
        '::WARNING file=lib/file1.dart,line=21,col=1::Warning message for file 1, hunk 2. (error_code_6) See https://dart.dev/diagnostic/error_code_6 or https://dart.dev/lints/error_code_6',
        '::ERROR file=lib/file1.dart,line=3,col=1::Error message for file 1, hunk 1. (error_code_8) See https://dart.dev/diagnostic/error_code_8 or https://dart.dev/lints/error_code_8',
        '::ERROR file=lib/file1.dart,line=22,col=1::Error message for file 1, hunk 2. (error_code_10) See https://dart.dev/diagnostic/error_code_10 or https://dart.dev/lints/error_code_10',
        '::NOTICE file=lib/file2.dart,line=50,col=1::Info message for file 2, hunk 1. (error_code_13) See https://dart.dev/diagnostic/error_code_13 or https://dart.dev/lints/error_code_13',
        '::NOTICE file=lib/file2.dart,line=200,col=1::Info message for file 2, hunk 2. (error_code_15) See https://dart.dev/diagnostic/error_code_15 or https://dart.dev/lints/error_code_15',
        '::WARNING file=lib/file2.dart,line=51,col=1::Warning message for file 2, hunk 1. (error_code_18) See https://dart.dev/diagnostic/error_code_18 or https://dart.dev/lints/error_code_18',
        '::WARNING file=lib/file2.dart,line=201,col=1::Warning message for file 2, hunk 2. (error_code_20) See https://dart.dev/diagnostic/error_code_20 or https://dart.dev/lints/error_code_20',
        '::ERROR file=lib/file2.dart,line=52,col=1::Error message for file 2, hunk 1. (error_code_23) See https://dart.dev/diagnostic/error_code_23 or https://dart.dev/lints/error_code_23',
        '::ERROR file=lib/file2.dart,line=202,col=1::Error message for file 2, hunk 2. (error_code_25) See https://dart.dev/diagnostic/error_code_25 or https://dart.dev/lints/error_code_25',
        '::endgroup::',
        '::group:: Analyze formatting',
        '::warning file=lib/file1.dart:: lib/file1.dart is not formatted',
        '::endgroup::',
      ].map((s) => [s]),
    );
    expect(core.setFailed).toHaveBeenCalledWith(
      `Dart Analyzer found 13 issues
- 4 errors.
- 4 warnings.
- 4 info logs.
- 1 formatting issue.`,
    );
  });

  it('should support when the analysis logs contain __w', async () => {
    // Mock the environment variables representing the action inputs.
    process.env.INPUT_TOKEN = 'token';
    const workingDirectory = '/home/runner/work/repository/repository';
    process.env.GITHUB_WORKSPACE = workingDirectory;

    // Mock the Github API.
    vi.mocked(github.context).eventName = 'pull_request';
    vi.mocked(github.context).payload = {
      pull_request: {
        number: 123,
        base: { sha: 'base-sha' },
        head: { sha: 'head-sha' },
      },
    } as unknown as WebhookPayload;
    vi.spyOn(github.context, 'repo', 'get').mockReturnValue({
      owner: 'test-owner',
      repo: 'test-repo',
    });

    const octokit: DeepPartial<InstanceType<typeof GitHub>> = {
      rest: {
        repos: {
          compareCommitsWithBasehead: vi.fn().mockResolvedValue({
            status: 200,
            data: {
              files: [
                {
                  filename: 'lib/file1.dart',
                  patch: `
@@ -1,4 +1,6 @@
 import 'package:flutter/material.dart';

-void main() => runApp(MyApp());
+void main() {
+  runApp(MyApp());
+}

@@ -20,3 +20,5 @@
 class MyApp extends StatelessWidget {
-  Widget build(BuildContext context) => MaterialApp(home: Container());
+  Widget build(BuildContext context) {
+    return MaterialApp(home: Container());
+  }
 }
                  `,
                },

                {
                  filename: 'lib/file2.dart',
                  patch: `
@@ -50,4 +50,6 @@
 import 'package:flutter/material.dart';

-void main() => runApp(MyApp());
+void main() {
+  runApp(MyApp());
+}

@@ -200,3 +200,5 @@
 class MyApp extends StatelessWidget {
-  Widget build(BuildContext context) => MaterialApp(home: Container());
+  Widget build(BuildContext context) {
+    return MaterialApp(home: Container());
+  }
 }
                  `,
                },
              ],
            },
          }) as any,
        },
        issues: {
          listComments: vi.fn().mockResolvedValue({
            data: [],
          }) as any,
          createComment: vi.fn().mockResolvedValue({}) as any,
        },
      },
    };

    vi.mocked(github.getOctokit).mockReturnValue(
      octokit as InstanceType<typeof GitHub>,
    );

    // Mock the read of the yaml file.
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    vi.mocked(path.resolve).mockReturnValueOnce(workingDirectory);
    vi.mocked(path.resolve).mockReturnValueOnce(
      'path/to/analysis_options.yaml',
    );
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('');

    // Mock the exec.exec function.
    vi.mocked(exec.exec).mockImplementationOnce(
      async (command, args, options) => {
        const lines = [
          // SEVERITY|TYPE|ERROR_CODE|FILE_PATH|LINE|COLUMN|LENGTH|ERROR_MESSAGE
          'INFO|LINT|PREFER_CONST_CONSTRUCTORS|/path/to/file.dart|96|13|80|Prefer const with constant constructors.',
          // # File 1.
          // Info.
          'INFO|LINT|ERROR_CODE_0|/__w/repository/repository/lib/file1.dart|1|1|1|Info message for file 1, hunk 1.', // Included.
          'INFO|LINT|ERROR_CODE_1|/__w/repository/repository/lib/file1.dart|10|1|1|Ignored info message for file 1.',
          'INFO|LINT|ERROR_CODE_2|/__w/repository/repository/lib/file1.dart|20|1|1|Info message for file 1, hunk 2.', // Included.
          'INFO|LINT|ERROR_CODE_3|/__w/repository/repository/lib/file1.dart|50|1|1|Ignored info message for file 1.',
          // Warning.
          'WARNING|LINT|ERROR_CODE_4|/__w/repository/repository/lib/file1.dart|2|1|1|Warning message for file 1, hunk 1.', // Included.
          'WARNING|LINT|ERROR_CODE_5|/__w/repository/repository/lib/file1.dart|11|1|1|Ignored warning message for file 1.',
          'WARNING|LINT|ERROR_CODE_6|/__w/repository/repository/lib/file1.dart|21|1|1|Warning message for file 1, hunk 2.', // Included.
          'WARNING|LINT|ERROR_CODE_7|/__w/repository/repository/lib/file1.dart|51|1|1|Ignored warning message for file 1.',
          // Errors.
          'ERROR|LINT|ERROR_CODE_8|/__w/repository/repository/lib/file1.dart|3|1|1|Error message for file 1, hunk 1.', // Included.
          'ERROR|LINT|ERROR_CODE_9|/__w/repository/repository/lib/file1.dart|12|1|1|Ignored error message for file 1.',
          'ERROR|LINT|ERROR_CODE_10|/__w/repository/repository/lib/file1.dart|22|1|1|Error message for file 1, hunk 2.', // Included.
          'ERROR|LINT|ERROR_CODE_11|/__w/repository/repository/lib/file1.dart|52|1|1|Ignored error message for file 1.',

          // # File 2.
          // Info.
          'INFO|LINT|ERROR_CODE_12|/__w/repository/repository/lib/file2.dart|1|1|1|Ignored info message for file 2.',
          'INFO|LINT|ERROR_CODE_13|/__w/repository/repository/lib/file2.dart|50|1|1|Info message for file 2, hunk 1.', // Included.
          'INFO|LINT|ERROR_CODE_14|/__w/repository/repository/lib/file2.dart|100|1|1|Ignored info message for file 2.',
          'INFO|LINT|ERROR_CODE_15|/__w/repository/repository/lib/file2.dart|200|1|1|Info message for file 2, hunk 2.', // Included.
          'INFO|LINT|ERROR_CODE_16|/__w/repository/repository/lib/file2.dart|500|1|1|Ignored info message for file 2.',
          // Warning.
          'WARNING|LINT|ERROR_CODE_17|/__w/repository/repository/lib/file2.dart|2|1|1|Ignored warning message for file 2.',
          'WARNING|LINT|ERROR_CODE_18|/__w/repository/repository/lib/file2.dart|51|1|1|Warning message for file 2, hunk 1.', // Included.
          'WARNING|LINT|ERROR_CODE_19|/__w/repository/repository/lib/file2.dart|101|1|1|Ignored warning message for file 2.',
          'WARNING|LINT|ERROR_CODE_20|/__w/repository/repository/lib/file2.dart|201|1|1|Warning message for file 2, hunk 2.', // Included.
          'WARNING|LINT|ERROR_CODE_21|/__w/repository/repository/lib/file2.dart|501|1|1|Ignored warning message for file 2.',
          // Errors.
          'ERROR|LINT|ERROR_CODE_22|/__w/repository/repository/lib/file2.dart|3|1|1|Ignored error message for file 2.',
          'ERROR|LINT|ERROR_CODE_23|/__w/repository/repository/lib/file2.dart|52|1|1|Error message for file 2, hunk 1.', // Included.
          'ERROR|LINT|ERROR_CODE_24|/__w/repository/repository/lib/file2.dart|102|1|1|Ignored error message for file 2.',
          'ERROR|LINT|ERROR_CODE_25|/__w/repository/repository/lib/file2.dart|202|1|1|Error message for file 2, hunk 2.', // Included.
          'ERROR|LINT|ERROR_CODE_26|/__w/repository/repository/lib/file2.dart|502|1|1|Ignored error message for file 2.',
          // # File 3 (not modified).
          'INFO|LINT|ERROR_CODE_27|/__w/repository/repository/lib/file3.dart|1|1|1|Info message for file 3',
          'WARNING|LINT|ERROR_CODE_27|/__w/repository/repository/lib/file3.dart|2|1|1|Warning message for file 3',
          'ERROR|LINT|ERROR_CODE_27|/__w/repository/repository/lib/file3.dart|3|1|1|Error message for file 3',
        ];

        for (const line of lines) {
          options!.listeners!.stdout!(Buffer.from(line + '\n'));
        }
        return 0;
      },
    );
    vi.mocked(exec.exec).mockImplementationOnce(
      async (command, args, options) => {
        const lines = [
          'Changed lib/file1.dart',
          'Changed lib/file3.dart',
          'Formatted 10 files (2 changed) in 0.123s',
        ];

        for (const line of lines) {
          options!.listeners!.stdout!(Buffer.from(line + '\n'));
        }
        return 0;
      },
    );

    await run();

    expect(
      octokit.rest?.repos?.compareCommitsWithBasehead,
    ).toHaveBeenCalledExactlyOnceWith({
      basehead: 'base-sha...head-sha',
      owner: 'test-owner',
      repo: 'test-repo',
    });
    expect(exec.exec).toHaveBeenCalledWith(
      'dart analyze --format machine',
      [workingDirectory],
      expect.anything(),
    );
    expect(exec.exec).toHaveBeenCalledWith(
      'dart format',
      ['-o', 'none', '.'],
      expect.anything(),
    );
    expect(octokit.rest!.issues!.listComments).toHaveBeenCalledExactlyOnceWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 123,
    });
    expect(octokit.rest!.issues!.createComment).toHaveBeenCalledExactlyOnceWith(
      {
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        body: `<!-- dart-analyze -->
:x: Dart Analyzer found 13 issues
- :x: **4 errors.**
- :warning: **4 warnings.**
- :eyes: 4 info logs.
- :poop: **1 formatting issue.**
---
- :eyes: Info - \`lib/file1.dart\`:1:1 - Info message for file 1, hunk 1. (error_code_0). See [link](https://dart.dev/diagnostic/error_code_0) or [link](https://dart.dev/lints/error_code_0).
- :eyes: Info - \`lib/file1.dart\`:20:1 - Info message for file 1, hunk 2. (error_code_2). See [link](https://dart.dev/diagnostic/error_code_2) or [link](https://dart.dev/lints/error_code_2).
- :warning: **Warning - \`lib/file1.dart\`:2:1 - Warning message for file 1, hunk 1. (error_code_4).** See [link](https://dart.dev/diagnostic/error_code_4) or [link](https://dart.dev/lints/error_code_4).
- :warning: **Warning - \`lib/file1.dart\`:21:1 - Warning message for file 1, hunk 2. (error_code_6).** See [link](https://dart.dev/diagnostic/error_code_6) or [link](https://dart.dev/lints/error_code_6).
- :bangbang: **Error - \`lib/file1.dart\`:3:1 - Error message for file 1, hunk 1. (error_code_8).** See [link](https://dart.dev/diagnostic/error_code_8) or [link](https://dart.dev/lints/error_code_8).
- :bangbang: **Error - \`lib/file1.dart\`:22:1 - Error message for file 1, hunk 2. (error_code_10).** See [link](https://dart.dev/diagnostic/error_code_10) or [link](https://dart.dev/lints/error_code_10).
- :eyes: Info - \`lib/file2.dart\`:50:1 - Info message for file 2, hunk 1. (error_code_13). See [link](https://dart.dev/diagnostic/error_code_13) or [link](https://dart.dev/lints/error_code_13).
- :eyes: Info - \`lib/file2.dart\`:200:1 - Info message for file 2, hunk 2. (error_code_15). See [link](https://dart.dev/diagnostic/error_code_15) or [link](https://dart.dev/lints/error_code_15).
- :warning: **Warning - \`lib/file2.dart\`:51:1 - Warning message for file 2, hunk 1. (error_code_18).** See [link](https://dart.dev/diagnostic/error_code_18) or [link](https://dart.dev/lints/error_code_18).
- :warning: **Warning - \`lib/file2.dart\`:201:1 - Warning message for file 2, hunk 2. (error_code_20).** See [link](https://dart.dev/diagnostic/error_code_20) or [link](https://dart.dev/lints/error_code_20).
- :bangbang: **Error - \`lib/file2.dart\`:52:1 - Error message for file 2, hunk 1. (error_code_23).** See [link](https://dart.dev/diagnostic/error_code_23) or [link](https://dart.dev/lints/error_code_23).
- :bangbang: **Error - \`lib/file2.dart\`:202:1 - Error message for file 2, hunk 2. (error_code_25).** See [link](https://dart.dev/diagnostic/error_code_25) or [link](https://dart.dev/lints/error_code_25).
---
- :poop:  **\`lib/file1.dart\` is not formatted.**`,
      },
    );
    expect(vi.mocked(console.log).mock.calls).toEqual(
      [
        '::group:: Analyze dart code',
        '::NOTICE file=lib/file1.dart,line=1,col=1::Info message for file 1, hunk 1. (error_code_0) See https://dart.dev/diagnostic/error_code_0 or https://dart.dev/lints/error_code_0',
        '::NOTICE file=lib/file1.dart,line=20,col=1::Info message for file 1, hunk 2. (error_code_2) See https://dart.dev/diagnostic/error_code_2 or https://dart.dev/lints/error_code_2',
        '::WARNING file=lib/file1.dart,line=2,col=1::Warning message for file 1, hunk 1. (error_code_4) See https://dart.dev/diagnostic/error_code_4 or https://dart.dev/lints/error_code_4',
        '::WARNING file=lib/file1.dart,line=21,col=1::Warning message for file 1, hunk 2. (error_code_6) See https://dart.dev/diagnostic/error_code_6 or https://dart.dev/lints/error_code_6',
        '::ERROR file=lib/file1.dart,line=3,col=1::Error message for file 1, hunk 1. (error_code_8) See https://dart.dev/diagnostic/error_code_8 or https://dart.dev/lints/error_code_8',
        '::ERROR file=lib/file1.dart,line=22,col=1::Error message for file 1, hunk 2. (error_code_10) See https://dart.dev/diagnostic/error_code_10 or https://dart.dev/lints/error_code_10',
        '::NOTICE file=lib/file2.dart,line=50,col=1::Info message for file 2, hunk 1. (error_code_13) See https://dart.dev/diagnostic/error_code_13 or https://dart.dev/lints/error_code_13',
        '::NOTICE file=lib/file2.dart,line=200,col=1::Info message for file 2, hunk 2. (error_code_15) See https://dart.dev/diagnostic/error_code_15 or https://dart.dev/lints/error_code_15',
        '::WARNING file=lib/file2.dart,line=51,col=1::Warning message for file 2, hunk 1. (error_code_18) See https://dart.dev/diagnostic/error_code_18 or https://dart.dev/lints/error_code_18',
        '::WARNING file=lib/file2.dart,line=201,col=1::Warning message for file 2, hunk 2. (error_code_20) See https://dart.dev/diagnostic/error_code_20 or https://dart.dev/lints/error_code_20',
        '::ERROR file=lib/file2.dart,line=52,col=1::Error message for file 2, hunk 1. (error_code_23) See https://dart.dev/diagnostic/error_code_23 or https://dart.dev/lints/error_code_23',
        '::ERROR file=lib/file2.dart,line=202,col=1::Error message for file 2, hunk 2. (error_code_25) See https://dart.dev/diagnostic/error_code_25 or https://dart.dev/lints/error_code_25',
        '::endgroup::',
        '::group:: Analyze formatting',
        '::warning file=lib/file1.dart:: lib/file1.dart is not formatted',
        '::endgroup::',
      ].map((s) => [s]),
    );
    expect(core.setFailed).toHaveBeenCalledWith(
      `Dart Analyzer found 13 issues
- 4 errors.
- 4 warnings.
- 4 info logs.
- 1 formatting issue.`,
    );
  });

  it('should run the action with severity overrides', async () => {
    // Mock the environment variables representing the action inputs.
    process.env.INPUT_TOKEN = 'token';
    const workingDirectory = '/home/runner/work/repository/repository';
    process.env.GITHUB_WORKSPACE = workingDirectory;
    process.env.INPUT_SEVERITY_OVERRIDES = `ERROR_CODE_0: note
ERROR_CODE_4: error
ERROR_CODE_8: warning
ERROR_CODE_13: warning
ERROR_CODE_18: note`;

    // Mock the Github API.
    vi.mocked(github.context).eventName = 'pull_request';
    vi.mocked(github.context).payload = {
      pull_request: {
        number: 123,
        base: { sha: 'base-sha' },
        head: { sha: 'head-sha' },
      },
    } as unknown as WebhookPayload;
    vi.spyOn(github.context, 'repo', 'get').mockReturnValue({
      owner: 'test-owner',
      repo: 'test-repo',
    });

    const octokit: DeepPartial<InstanceType<typeof GitHub>> = {
      rest: {
        repos: {
          compareCommitsWithBasehead: vi.fn().mockResolvedValue({
            status: 200,
            data: {
              files: [
                {
                  filename: 'lib/file1.dart',
                  patch: `
@@ -1,4 +1,6 @@
 import 'package:flutter/material.dart';

-void main() => runApp(MyApp());
+void main() {
+  runApp(MyApp());
+}

@@ -20,3 +20,5 @@
 class MyApp extends StatelessWidget {
-  Widget build(BuildContext context) => MaterialApp(home: Container());
+  Widget build(BuildContext context) {
+    return MaterialApp(home: Container());
+  }
 }
                  `,
                },

                {
                  filename: 'lib/file2.dart',
                  patch: `
@@ -50,4 +50,6 @@
 import 'package:flutter/material.dart';

-void main() => runApp(MyApp());
+void main() {
+  runApp(MyApp());
+}

@@ -200,3 +200,5 @@
 class MyApp extends StatelessWidget {
-  Widget build(BuildContext context) => MaterialApp(home: Container());
+  Widget build(BuildContext context) {
+    return MaterialApp(home: Container());
+  }
 }
                  `,
                },
              ],
            },
          }) as any,
        },
        issues: {
          listComments: vi.fn().mockResolvedValue({
            data: [],
          }) as any,
          createComment: vi.fn().mockResolvedValue({}) as any,
        },
      },
    };

    vi.mocked(github.getOctokit).mockReturnValue(
      octokit as InstanceType<typeof GitHub>,
    );

    // Mock the read of the yaml file.
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    vi.mocked(path.resolve).mockReturnValueOnce(workingDirectory);
    vi.mocked(path.resolve).mockReturnValueOnce(
      'path/to/analysis_options.yaml',
    );
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('');

    // Mock the exec.exec function.
    vi.mocked(exec.exec).mockImplementationOnce(
      async (command, args, options) => {
        const lines = [
          // SEVERITY|TYPE|ERROR_CODE|FILE_PATH|LINE|COLUMN|LENGTH|ERROR_MESSAGE
          'INFO|LINT|PREFER_CONST_CONSTRUCTORS|/path/to/file.dart|96|13|80|Prefer const with constant constructors.',
          // # File 1.
          // Info.
          'INFO|LINT|ERROR_CODE_0|lib/file1.dart|1|1|1|Info message for file 1, hunk 1.', // Included.
          'INFO|LINT|ERROR_CODE_1|lib/file1.dart|10|1|1|Ignored info message for file 1.',
          'INFO|LINT|ERROR_CODE_2|lib/file1.dart|20|1|1|Info message for file 1, hunk 2.', // Included.
          'INFO|LINT|ERROR_CODE_3|lib/file1.dart|50|1|1|Ignored info message for file 1.',
          // Warning.
          'WARNING|LINT|ERROR_CODE_4|lib/file1.dart|2|1|1|Warning message for file 1, hunk 1.', // Included.
          'WARNING|LINT|ERROR_CODE_5|lib/file1.dart|11|1|1|Ignored warning message for file 1.',
          'WARNING|LINT|ERROR_CODE_6|lib/file1.dart|21|1|1|Warning message for file 1, hunk 2.', // Included.
          'WARNING|LINT|ERROR_CODE_7|lib/file1.dart|51|1|1|Ignored warning message for file 1.',
          // Errors.
          'ERROR|LINT|ERROR_CODE_8|lib/file1.dart|3|1|1|Error message for file 1, hunk 1.', // Included.
          'ERROR|LINT|ERROR_CODE_9|lib/file1.dart|12|1|1|Ignored error message for file 1.',
          'ERROR|LINT|ERROR_CODE_10|lib/file1.dart|22|1|1|Error message for file 1, hunk 2.', // Included.
          'ERROR|LINT|ERROR_CODE_11|lib/file1.dart|52|1|1|Ignored error message for file 1.',

          // # File 2.
          // Info.
          'INFO|LINT|ERROR_CODE_12|lib/file2.dart|1|1|1|Ignored info message for file 2.',
          'INFO|LINT|ERROR_CODE_13|lib/file2.dart|50|1|1|Info message for file 2, hunk 1.', // Included.
          'INFO|LINT|ERROR_CODE_14|lib/file2.dart|100|1|1|Ignored info message for file 2.',
          'INFO|LINT|ERROR_CODE_15|lib/file2.dart|200|1|1|Info message for file 2, hunk 2.', // Included.
          'INFO|LINT|ERROR_CODE_16|lib/file2.dart|500|1|1|Ignored info message for file 2.',
          // Warning.
          'WARNING|LINT|ERROR_CODE_17|lib/file2.dart|2|1|1|Ignored warning message for file 2.',
          'WARNING|LINT|ERROR_CODE_18|lib/file2.dart|51|1|1|Warning message for file 2, hunk 1.', // Included.
          'WARNING|LINT|ERROR_CODE_19|lib/file2.dart|101|1|1|Ignored warning message for file 2.',
          'WARNING|LINT|ERROR_CODE_20|lib/file2.dart|201|1|1|Warning message for file 2, hunk 2.', // Included.
          'WARNING|LINT|ERROR_CODE_21|lib/file2.dart|501|1|1|Ignored warning message for file 2.',
          // Errors.
          'ERROR|LINT|ERROR_CODE_22|lib/file2.dart|3|1|1|Ignored error message for file 2.',
          'ERROR|LINT|ERROR_CODE_23|lib/file2.dart|52|1|1|Error message for file 2, hunk 1.', // Included.
          'ERROR|LINT|ERROR_CODE_24|lib/file2.dart|102|1|1|Ignored error message for file 2.',
          'ERROR|LINT|ERROR_CODE_25|lib/file2.dart|202|1|1|Error message for file 2, hunk 2.', // Included.
          'ERROR|LINT|ERROR_CODE_26|lib/file2.dart|502|1|1|Ignored error message for file 2.',
          // # File 3 (not modified).
          'INFO|LINT|ERROR_CODE_27|lib/file3.dart|1|1|1|Info message for file 3',
          'WARNING|LINT|ERROR_CODE_27|lib/file3.dart|2|1|1|Warning message for file 3',
          'ERROR|LINT|ERROR_CODE_27|lib/file3.dart|3|1|1|Error message for file 3',
        ];

        for (const line of lines) {
          options!.listeners!.stdout!(Buffer.from(line + '\n'));
        }
        return 0;
      },
    );
    vi.mocked(exec.exec).mockImplementationOnce(
      async (command, args, options) => {
        const lines = [
          'Changed lib/file1.dart',
          'Changed lib/file3.dart',
          'Formatted 10 files (2 changed) in 0.123s',
        ];

        for (const line of lines) {
          options!.listeners!.stdout!(Buffer.from(line + '\n'));
        }
        return 0;
      },
    );

    await run();

    expect(
      octokit.rest?.repos?.compareCommitsWithBasehead,
    ).toHaveBeenCalledExactlyOnceWith({
      basehead: 'base-sha...head-sha',
      owner: 'test-owner',
      repo: 'test-repo',
    });
    expect(exec.exec).toHaveBeenCalledWith(
      'dart analyze --format machine',
      [workingDirectory],
      expect.anything(),
    );
    expect(exec.exec).toHaveBeenCalledWith(
      'dart format',
      ['-o', 'none', '.'],
      expect.anything(),
    );
    expect(octokit.rest!.issues!.listComments).toHaveBeenCalledExactlyOnceWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 123,
    });
    expect(octokit.rest!.issues!.createComment).toHaveBeenCalledExactlyOnceWith(
      {
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        body: `<!-- dart-analyze -->
:x: Dart Analyzer found 13 issues
- :x: **4 errors.**
- :warning: **4 warnings.**
- :eyes: 2 info logs.
- :memo: 2 note logs.
- :poop: **1 formatting issue.**
---
- :memo: Note - \`lib/file1.dart\`:1:1 - Info message for file 1, hunk 1. (error_code_0). See [link](https://dart.dev/diagnostic/error_code_0) or [link](https://dart.dev/lints/error_code_0).
- :eyes: Info - \`lib/file1.dart\`:20:1 - Info message for file 1, hunk 2. (error_code_2). See [link](https://dart.dev/diagnostic/error_code_2) or [link](https://dart.dev/lints/error_code_2).
- :bangbang: **Error - \`lib/file1.dart\`:2:1 - Warning message for file 1, hunk 1. (error_code_4).** See [link](https://dart.dev/diagnostic/error_code_4) or [link](https://dart.dev/lints/error_code_4).
- :warning: **Warning - \`lib/file1.dart\`:21:1 - Warning message for file 1, hunk 2. (error_code_6).** See [link](https://dart.dev/diagnostic/error_code_6) or [link](https://dart.dev/lints/error_code_6).
- :warning: **Warning - \`lib/file1.dart\`:3:1 - Error message for file 1, hunk 1. (error_code_8).** See [link](https://dart.dev/diagnostic/error_code_8) or [link](https://dart.dev/lints/error_code_8).
- :bangbang: **Error - \`lib/file1.dart\`:22:1 - Error message for file 1, hunk 2. (error_code_10).** See [link](https://dart.dev/diagnostic/error_code_10) or [link](https://dart.dev/lints/error_code_10).
- :warning: **Warning - \`lib/file2.dart\`:50:1 - Info message for file 2, hunk 1. (error_code_13).** See [link](https://dart.dev/diagnostic/error_code_13) or [link](https://dart.dev/lints/error_code_13).
- :eyes: Info - \`lib/file2.dart\`:200:1 - Info message for file 2, hunk 2. (error_code_15). See [link](https://dart.dev/diagnostic/error_code_15) or [link](https://dart.dev/lints/error_code_15).
- :memo: Note - \`lib/file2.dart\`:51:1 - Warning message for file 2, hunk 1. (error_code_18). See [link](https://dart.dev/diagnostic/error_code_18) or [link](https://dart.dev/lints/error_code_18).
- :warning: **Warning - \`lib/file2.dart\`:201:1 - Warning message for file 2, hunk 2. (error_code_20).** See [link](https://dart.dev/diagnostic/error_code_20) or [link](https://dart.dev/lints/error_code_20).
- :bangbang: **Error - \`lib/file2.dart\`:52:1 - Error message for file 2, hunk 1. (error_code_23).** See [link](https://dart.dev/diagnostic/error_code_23) or [link](https://dart.dev/lints/error_code_23).
- :bangbang: **Error - \`lib/file2.dart\`:202:1 - Error message for file 2, hunk 2. (error_code_25).** See [link](https://dart.dev/diagnostic/error_code_25) or [link](https://dart.dev/lints/error_code_25).
---
- :poop:  **\`lib/file1.dart\` is not formatted.**`,
      },
    );
    expect(vi.mocked(console.log).mock.calls).toEqual(
      [
        '::group:: Analyze dart code',
        '::NOTICE file=lib/file1.dart,line=1,col=1::Info message for file 1, hunk 1. (error_code_0) See https://dart.dev/diagnostic/error_code_0 or https://dart.dev/lints/error_code_0',
        '::NOTICE file=lib/file1.dart,line=20,col=1::Info message for file 1, hunk 2. (error_code_2) See https://dart.dev/diagnostic/error_code_2 or https://dart.dev/lints/error_code_2',
        '::ERROR file=lib/file1.dart,line=2,col=1::Warning message for file 1, hunk 1. (error_code_4) See https://dart.dev/diagnostic/error_code_4 or https://dart.dev/lints/error_code_4',
        '::WARNING file=lib/file1.dart,line=21,col=1::Warning message for file 1, hunk 2. (error_code_6) See https://dart.dev/diagnostic/error_code_6 or https://dart.dev/lints/error_code_6',
        '::WARNING file=lib/file1.dart,line=3,col=1::Error message for file 1, hunk 1. (error_code_8) See https://dart.dev/diagnostic/error_code_8 or https://dart.dev/lints/error_code_8',
        '::ERROR file=lib/file1.dart,line=22,col=1::Error message for file 1, hunk 2. (error_code_10) See https://dart.dev/diagnostic/error_code_10 or https://dart.dev/lints/error_code_10',
        '::WARNING file=lib/file2.dart,line=50,col=1::Info message for file 2, hunk 1. (error_code_13) See https://dart.dev/diagnostic/error_code_13 or https://dart.dev/lints/error_code_13',
        '::NOTICE file=lib/file2.dart,line=200,col=1::Info message for file 2, hunk 2. (error_code_15) See https://dart.dev/diagnostic/error_code_15 or https://dart.dev/lints/error_code_15',
        '::NOTICE file=lib/file2.dart,line=51,col=1::Warning message for file 2, hunk 1. (error_code_18) See https://dart.dev/diagnostic/error_code_18 or https://dart.dev/lints/error_code_18',
        '::WARNING file=lib/file2.dart,line=201,col=1::Warning message for file 2, hunk 2. (error_code_20) See https://dart.dev/diagnostic/error_code_20 or https://dart.dev/lints/error_code_20',
        '::ERROR file=lib/file2.dart,line=52,col=1::Error message for file 2, hunk 1. (error_code_23) See https://dart.dev/diagnostic/error_code_23 or https://dart.dev/lints/error_code_23',
        '::ERROR file=lib/file2.dart,line=202,col=1::Error message for file 2, hunk 2. (error_code_25) See https://dart.dev/diagnostic/error_code_25 or https://dart.dev/lints/error_code_25',
        '::endgroup::',
        '::group:: Analyze formatting',
        '::warning file=lib/file1.dart:: lib/file1.dart is not formatted',
        '::endgroup::',
      ].map((s) => [s]),
    );
    expect(core.setFailed).toHaveBeenCalledWith(
      `Dart Analyzer found 13 issues
- 4 errors.
- 4 warnings.
- 2 info logs.
- 2 note logs.
- 1 formatting issue.`,
    );
  });

  it('should run the action with a severity overrides and only 1 non failing log being overridden', async () => {
    const workingDirectory = '/home/runner/work/repository/repository';
    process.env.GITHUB_WORKSPACE = workingDirectory;

    // Mock the Github API.
    vi.mocked(github.context).eventName = 'pull_request';
    vi.mocked(github.context).payload = {
      pull_request: {
        number: 123,
        base: { sha: 'base-sha' },
        head: { sha: 'head-sha' },
      },
    } as unknown as WebhookPayload;
    vi.spyOn(github.context, 'repo', 'get').mockReturnValue({
      owner: 'test-owner',
      repo: 'test-repo',
    });

    const octokit: DeepPartial<InstanceType<typeof GitHub>> = {
      rest: {
        repos: {
          compareCommitsWithBasehead: vi.fn().mockResolvedValue({
            status: 200,
            data: {
              files: [
                {
                  filename: 'lib/file1.dart',
                  patch: `
@@ -1,4 +1,6 @@
 import 'package:flutter/material.dart';

-void main() => runApp(MyApp());
+void main() {
+  runApp(MyApp());
+}
                  `,
                },
              ],
            },
          }) as any,
        },
        issues: {
          listComments: vi.fn().mockResolvedValue({
            data: [],
          }) as any,
          createComment: vi.fn().mockResolvedValue({}) as any,
        },
      },
    };

    vi.mocked(github.getOctokit).mockReturnValue(
      octokit as InstanceType<typeof GitHub>,
    );

    // Mock the read of the yaml file.
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    vi.mocked(path.resolve).mockReturnValueOnce(workingDirectory);
    vi.mocked(path.resolve).mockReturnValueOnce(
      'path/to/analysis_options.yaml',
    );
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('');

    // Mock the exec.exec function.
    vi.mocked(exec.exec).mockImplementationOnce(
      async (command, args, options) => {
        const lines = [
          'INFO|LINT|ERROR_CODE_0|lib/file1.dart|1|1|1|Info message for file 1, hunk 1.', // Included.
        ];

        for (const line of lines) {
          options!.listeners!.stdout!(Buffer.from(line + '\n'));
        }
        return 0;
      },
    );
    vi.mocked(exec.exec).mockImplementationOnce(
      async (command, args, options) => {
        const lines = ['Formatted 1 files (0 changed) in 0.1s'];

        for (const line of lines) {
          options!.listeners!.stdout!(Buffer.from(line + '\n'));
        }
        return 0;
      },
    );

    await run({
      token: 'token',
      severityOverrides: new Map([
        ['error_code_0', DartAnalyzeLogTypeEnum.Note],
      ]),
    });

    expect(
      octokit.rest?.repos?.compareCommitsWithBasehead,
    ).toHaveBeenCalledExactlyOnceWith({
      basehead: 'base-sha...head-sha',
      owner: 'test-owner',
      repo: 'test-repo',
    });
    expect(exec.exec).toHaveBeenCalledWith(
      'dart analyze --format machine',
      [workingDirectory],
      expect.anything(),
    );
    expect(exec.exec).toHaveBeenCalledWith(
      'dart format',
      ['-o', 'none', '.'],
      expect.anything(),
    );
    expect(octokit.rest!.issues!.listComments).toHaveBeenCalledExactlyOnceWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 123,
    });
    expect(octokit.rest!.issues!.createComment).toHaveBeenCalledExactlyOnceWith(
      {
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        body: `<!-- dart-analyze -->
:warning: Dart Analyzer found 1 issue
- :white_check_mark: 0 error.
- :tada: 0 warning.
- :rocket: 0 info log.
- :memo: 1 note log.
- :art: 0 formatting issue.
---
- :memo: Note - \`lib/file1.dart\`:1:1 - Info message for file 1, hunk 1. (error_code_0). See [link](https://dart.dev/diagnostic/error_code_0) or [link](https://dart.dev/lints/error_code_0).`,
      },
    );
    expect(vi.mocked(console.log).mock.calls).toEqual(
      [
        '::group:: Analyze dart code',
        '::NOTICE file=lib/file1.dart,line=1,col=1::Info message for file 1, hunk 1. (error_code_0) See https://dart.dev/diagnostic/error_code_0 or https://dart.dev/lints/error_code_0',
        '::endgroup::',
        '::group:: Analyze formatting',
        '::endgroup::',
      ].map((s) => [s]),
    );
    expect(core.warning).toHaveBeenCalledWith(
      `Dart Analyzer found 1 issue
- 0 error.
- 0 warning.
- 0 info log.
- 1 note log.
- 0 formatting issue.`,
    );
  });
});
