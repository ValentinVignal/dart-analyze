import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getInputString,
  getInputNumber,
  getInputMultilineString,
} from './getInput.js';

describe('getInputString', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('returns undefined if input is not set', () => {
    delete process.env.INPUT_FOO;
    expect(getInputString('foo')).toBeUndefined();
  });

  it('returns value for direct input', () => {
    process.env.INPUT_BAR = 'baz';
    expect(getInputString('bar')).toBe('baz');
  });

  it('returns value for dash/underscore fallback', () => {
    process.env.INPUT_FAIL_ON = 'warning';
    expect(getInputString('fail-on')).toBe('warning');
  });

  it('trims whitespace', () => {
    process.env.INPUT_BAR = '  spaced  ';
    expect(getInputString('bar')).toBe('spaced');
  });
});

describe('getInputNumber', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('returns undefined if input is not set', () => {
    delete process.env.INPUT_NUM;
    expect(getInputNumber('num')).toBeUndefined();
  });

  it('parses integer value', () => {
    process.env.INPUT_NUM = '42';
    expect(getInputNumber('num')).toBe(42);
  });

  it('parses value with whitespace', () => {
    process.env.INPUT_NUM = '  7  ';
    expect(getInputNumber('num')).toBe(7);
  });
});

describe('getInputMultilineString', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('returns undefined if input is not set', () => {
    delete process.env.INPUT_MULTI;
    expect(getInputMultilineString('multi')).toBeUndefined();
  });

  it('splits lines and trims', () => {
    process.env.INPUT_MULTI = 'foo\n bar \n\nbaz\n';
    expect(getInputMultilineString('multi')).toEqual(['foo', 'bar', 'baz']);
  });

  it('handles single line', () => {
    process.env.INPUT_MULTI = 'single';
    expect(getInputMultilineString('multi')).toEqual(['single']);
  });
});
