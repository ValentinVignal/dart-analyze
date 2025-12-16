import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModifiedFile, ModifiedFiles } from '../utils/ModifiedFiles.js';
import { analyze } from './analyze.js';
import { DartAnalyzeLogTypeEnum } from './DartAnalyzeLogType.js';

const fakeActionOptions = {
  workingDirectory: '/repo',
  analyzerLines: undefined,
  emojis: false,
  failOn: 0,
  token: 'token',
} as any;

describe('analyze', () => {
  let fakeModifiedFiles: Partial<ModifiedFiles>;

  beforeEach(() => {
    // Fake ModifiedFiles with all required properties
    fakeModifiedFiles = {
      files: new Map(),
      isInit: Promise.resolve(true),
      has: vi.fn(() => true),
      get: vi.fn(
        (fileName: string) =>
          ({ hasAdditionLine: vi.fn(() => true) }) as unknown as ModifiedFile,
      ),
    };
    // Mock exec.exec
    vi.mock('@actions/exec', () => ({ exec: vi.fn().mockResolvedValue(0) }));

    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('parses analyzerLines and returns AnalyzeResult', async () => {
    const lines = [
      'ERROR|LINT|PREFER_CONST_CONSTRUCTORS|/repo/lib/main.dart|96|13|80|Prefer const with constant constructors.',
      'WARNING|LINT|AVOID_PRINT|/repo/lib/foo.dart|10|2|10|Avoid print calls.',
      'INFO|LINT|UNUSED_IMPORT|/repo/lib/bar.dart|5|1|5|Unused import.',
    ];
    const actionOptions = { ...fakeActionOptions, analyzerLines: lines };
    const result = await analyze({
      modifiedFiles: fakeModifiedFiles as ModifiedFiles,
      actionOptions,
    });
    expect(result.counts.errors).toBe(1);
    expect(result.counts.warnings).toBe(1);
    expect(result.counts.info).toBe(1);
    expect(result.lines.length).toBe(3);
    expect(result.lines?.[0]?.line.type).toBe(DartAnalyzeLogTypeEnum.Error);
    expect(result.lines?.[1]?.line.type).toBe(DartAnalyzeLogTypeEnum.Warning);
    expect(result.lines?.[2]?.line.type).toBe(DartAnalyzeLogTypeEnum.Info);
  });

  it('skips lines not containing delimiter', async () => {
    const lines = ['not a log line'];
    const actionOptions = { ...fakeActionOptions, analyzerLines: lines };
    const result = await analyze({
      modifiedFiles: fakeModifiedFiles as ModifiedFiles,
      actionOptions,
    });
    expect(result.lines.length).toBe(0);
  });

  it('skips files not in modifiedFiles', async () => {
    fakeModifiedFiles.has = vi.fn(() => false);
    const lines = [
      'ERROR|LINT|PREFER_CONST_CONSTRUCTORS|/repo/lib/main.dart|96|13|80|Prefer const with constant constructors.',
    ];
    const actionOptions = { ...fakeActionOptions, analyzerLines: lines };
    const result = await analyze({
      modifiedFiles: fakeModifiedFiles as ModifiedFiles,
      actionOptions,
    });
    expect(result.lines.length).toBe(0);
  });

  it('skips lines not in additions', async () => {
    fakeModifiedFiles.get = vi.fn(
      () =>
        ({
          hasAdditionLine: vi.fn(() => false),
        }) as unknown as ModifiedFile,
    );
    const lines = [
      'ERROR|LINT|PREFER_CONST_CONSTRUCTORS|/repo/lib/main.dart|96|13|80|Prefer const with constant constructors.',
    ];
    const actionOptions = { ...fakeActionOptions, analyzerLines: lines };
    const result = await analyze({
      modifiedFiles: fakeModifiedFiles as ModifiedFiles,
      actionOptions,
    });
    expect(result.lines.length).toBe(0);
  });

  it('parses analyzerLines and returns AnalyzeResult accordingly to the severity overrides', async () => {
    const lines = [
      'ERROR|LINT|PREFER_CONST_CONSTRUCTORS|/repo/lib/main.dart|96|13|80|Prefer const with constant constructors.',
      'WARNING|LINT|AVOID_PRINT|/repo/lib/foo.dart|10|2|10|Avoid print calls.',
      'INFO|LINT|UNUSED_IMPORT|/repo/lib/bar.dart|5|1|5|Unused import.',
    ];
    const actionOptions = {
      ...fakeActionOptions,
      analyzerLines: lines,
      severityOverrides: new Map([
        ['prefer_const_constructors', DartAnalyzeLogTypeEnum.Note],
        ['avoid_print', DartAnalyzeLogTypeEnum.Info],
        ['unused_import', DartAnalyzeLogTypeEnum.Warning],
      ]),
    };
    const result = await analyze({
      modifiedFiles: fakeModifiedFiles as ModifiedFiles,
      actionOptions,
    });
    expect(result.counts.errors).toBe(0);
    expect(result.counts.warnings).toBe(1);
    expect(result.counts.info).toBe(1);
    expect(result.counts.notes).toBe(1);
    expect(result.lines.length).toBe(3);
    expect(result.lines?.[0]?.line.type).toBe(DartAnalyzeLogTypeEnum.Note);
    expect(result.lines?.[1]?.line.type).toBe(DartAnalyzeLogTypeEnum.Info);
    expect(result.lines?.[2]?.line.type).toBe(DartAnalyzeLogTypeEnum.Warning);
  });
});
