import { describe, it, expect, beforeAll } from 'vitest';
import { ParsedLine } from './ParsedLine.js';
import { FailOnEnum } from '../utils/FailOn.js';
import { DartAnalyzeLogTypeEnum } from './DartAnalyzeLogType.js';

const GITHUB_WORKSPACE = '/home/runner/work/repo';

const baseLine =
  'ERROR|LINT|PREFER_CONST_CONSTRUCTORS|/home/runner/work/repo/lib/main.dart|96|13|80|Prefer const with constant constructors.';
const warningLine =
  'WARNING|LINT|AVOID_PRINT|/home/runner/work/repo/lib/foo.dart|10|2|10|Avoid print calls.';
const infoLine =
  'INFO|LINT|UNUSED_IMPORT|/home/runner/work/repo/lib/bar.dart|5|1|5|Unused import.';

const makeOptions = (failOn: number) => ({ failOn }) as any;

describe('ParsedLine', () => {
  it('parses error line correctly', () => {
    const pl = new ParsedLine(
      { line: baseLine },
      makeOptions(FailOnEnum.Error),
    );
    expect(pl.type).toBe(DartAnalyzeLogTypeEnum.Error);
    expect(pl.file).toBe('/home/runner/work/repo/lib/main.dart');
    expect(pl.line).toBe(96);
    expect(pl.column).toBe(13);
    expect(pl.lintName).toBe('prefer_const_constructors');
    expect(pl.message).toBe('Prefer const with constant constructors.');
    expect(pl.urls[0]).toContain('prefer_const_constructors');
    expect(pl.originalLine).toBe(baseLine);
  });

  it('parses warning line correctly', () => {
    const pl = new ParsedLine(
      { line: warningLine },
      makeOptions(FailOnEnum.Warning),
    );
    expect(pl.type).toBe(DartAnalyzeLogTypeEnum.Warning);
    expect(pl.lintName).toBe('avoid_print');
    expect(pl.file).toBe('/home/runner/work/repo/lib/foo.dart');
    expect(pl.line).toBe(10);
    expect(pl.column).toBe(2);
    expect(pl.message).toBe('Avoid print calls.');
  });

  it('parses info line correctly', () => {
    const pl = new ParsedLine({ line: infoLine }, makeOptions(FailOnEnum.Info));
    expect(pl.type).toBe(DartAnalyzeLogTypeEnum.Info);
    expect(pl.lintName).toBe('unused_import');
    expect(pl.file).toBe('/home/runner/work/repo/lib/bar.dart');
    expect(pl.line).toBe(5);
    expect(pl.column).toBe(1);
    expect(pl.message).toBe('Unused import.');
  });

  it('returns correct emoji', () => {
    expect(
      new ParsedLine({ line: baseLine }, makeOptions(FailOnEnum.Error)).emoji,
    ).toBe(':bangbang:');
    expect(
      new ParsedLine({ line: warningLine }, makeOptions(FailOnEnum.Warning))
        .emoji,
    ).toBe(':warning:');
    expect(
      new ParsedLine({ line: infoLine }, makeOptions(FailOnEnum.Info)).emoji,
    ).toBe(':eyes:');
  });

  it('returns correct isFail for each failOn', () => {
    expect(
      new ParsedLine({ line: baseLine }, makeOptions(FailOnEnum.Nothing))
        .isFail,
    ).toBe(false);
    expect(
      new ParsedLine({ line: baseLine }, makeOptions(FailOnEnum.Error)).isFail,
    ).toBe(true);
    expect(
      new ParsedLine({ line: warningLine }, makeOptions(FailOnEnum.Error))
        .isFail,
    ).toBe(false);
    expect(
      new ParsedLine({ line: warningLine }, makeOptions(FailOnEnum.Warning))
        .isFail,
    ).toBe(true);
    expect(
      new ParsedLine({ line: infoLine }, makeOptions(FailOnEnum.Info)).isFail,
    ).toBe(true);
  });
});
