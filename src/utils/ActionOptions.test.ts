import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DartAnalyzeLogTypeEnum } from '../analyze/DartAnalyzeLogType.js';
import { applyDefaults } from './ActionOptions.js';
import { FailOnEnum } from './FailOn.js';

describe('applyDefaults', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('throws if token is missing', () => {
    delete process.env.INPUT_TOKEN;
    expect(() => applyDefaults()).toThrow('The token is required');
  });

  it('uses token from env', () => {
    process.env.INPUT_TOKEN = 'abc';
    process.env.GITHUB_WORKSPACE = '/ws';
    const result = applyDefaults();
    expect(result.token).toBe('abc');
  });

  it('uses failOn from env', () => {
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_FAIL_ON = 'info';
    process.env.GITHUB_WORKSPACE = '/ws';
    const result = applyDefaults();
    expect(result.failOn).toBe(FailOnEnum.Info);
  });

  it('uses workingDirectory from env', () => {
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_WORKING_DIRECTORY = 'src';
    process.env.GITHUB_WORKSPACE = '/ws';
    const result = applyDefaults();
    expect(result.workingDirectory).toMatch(/\/ws/);
  });

  it('uses checkRenamedFiles from env', () => {
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_CHECK_RENAMED_FILES = 'true';
    process.env.GITHUB_WORKSPACE = '/ws';
    const result = applyDefaults();
    expect(result.checkRenamedFiles).toBe(true);
  });

  it('uses emojis and format from env', () => {
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_EMOJIS = 'false';
    process.env.INPUT_FORMAT = 'false';
    process.env.GITHUB_WORKSPACE = '/ws';
    const result = applyDefaults();
    expect(result.emojis).toBe(false);
    expect(result.format).toBe(false);
  });

  it('uses lineLength from env', () => {
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_LINE_LENGTH = '120';
    process.env.GITHUB_WORKSPACE = '/ws';
    const result = applyDefaults();
    expect(result.lineLength).toBe(120);
  });

  it('uses analyzerLines and formatLines from env', () => {
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_ANALYZER_LINES = 'foo\nbar';
    process.env.INPUT_FORMAT_LINES = 'baz\nqux';
    process.env.GITHUB_WORKSPACE = '/ws';
    const result = applyDefaults();
    expect(result.analyzerLines).toEqual(['foo', 'bar']);
    expect(result.formatLines).toEqual(['baz', 'qux']);
  });

  it('prefers options over env', () => {
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_FAIL_ON = 'warning';
    process.env.GITHUB_WORKSPACE = '/ws';
    const result = applyDefaults({
      token: 'xyz',
      failOn: FailOnEnum.Error,
      workingDirectory: 'custom',
      checkRenamedFiles: true,
      emojis: false,
      format: false,
      lineLength: 77,
      analyzerLines: ['a'],
      formatLines: ['b'],
    });
    expect(result.token).toBe('xyz');
    expect(result.failOn).toBe(FailOnEnum.Error);
    expect(result.workingDirectory).toMatch(/custom/);
    expect(result.checkRenamedFiles).toBe(true);
    expect(result.emojis).toBe(false);
    expect(result.format).toBe(false);
    expect(result.lineLength).toBe(77);
    expect(result.analyzerLines).toEqual(['a']);
    expect(result.formatLines).toEqual(['b']);
  });

  it('should parse the severity-overrides multiline input', () => {
    process.env.INPUT_SEVERITY_OVERRIDES = `rule1: error
rule2: warning
rule3: info
rule4: note`;
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_FAIL_ON = 'warning';
    process.env.GITHUB_WORKSPACE = '/ws';

    const result = applyDefaults();

    expect(result.severityOverrides).toEqual(
      new Map<string, DartAnalyzeLogTypeEnum>([
        ['rule1', DartAnalyzeLogTypeEnum.Error],
        ['rule2', DartAnalyzeLogTypeEnum.Warning],
        ['rule3', DartAnalyzeLogTypeEnum.Info],
        ['rule4', DartAnalyzeLogTypeEnum.Note],
      ]),
    );
  });

  it('should parse the severity-overrides comma separated input', () => {
    process.env.INPUT_SEVERITY_OVERRIDES = `rule1: error, rule2: warning, rule3: info, rule4: note`;
    process.env.INPUT_TOKEN = 'abc';
    process.env.INPUT_FAIL_ON = 'warning';
    process.env.GITHUB_WORKSPACE = '/ws';

    const result = applyDefaults();

    expect(result.severityOverrides).toEqual(
      new Map<string, DartAnalyzeLogTypeEnum>([
        ['rule1', DartAnalyzeLogTypeEnum.Error],
        ['rule2', DartAnalyzeLogTypeEnum.Warning],
        ['rule3', DartAnalyzeLogTypeEnum.Info],
        ['rule4', DartAnalyzeLogTypeEnum.Note],
      ]),
    );
  });
});
