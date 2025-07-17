import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as core from '@actions/core';
import { getInputSafe } from './getInput.js';

describe('getInputSafe', () => {
  let getInputSpy: ReturnType<typeof vi.spyOn> & {
    mockImplementation: any;
    mockRestore: any;
  };

  beforeEach(() => {
    getInputSpy = vi.spyOn(core, 'getInput') as any;
  });

  afterEach(() => {
    getInputSpy.mockRestore();
    vi.resetAllMocks();
  });

  it('returns value for direct input name', () => {
    getInputSpy.mockImplementation((name: string) =>
      name === 'emojis' ? 'true' : '',
    );
    expect(getInputSafe('emojis')).toBe('true');
  });

  it('returns value for dash input from github action', () => {
    getInputSpy.mockImplementation((name: string) =>
      name === 'fail-on' ? 'warning' : '',
    );
    expect(getInputSafe('fail-on')).toBe('warning');
  });

  it('returns value for dash input from bash script fallback', () => {
    getInputSpy.mockImplementation((name: string) => {
      if (name === 'fail-on') return '';
      if (name === 'fail_on') return 'info';
      return '';
    });
    expect(getInputSafe('fail-on')).toBe('info');
  });

  it('throws if required and not supplied (no dash)', () => {
    getInputSpy.mockImplementation(() => '');
    expect(() => getInputSafe('token', { required: true })).toThrowError(
      'Input required and not supplied: token',
    );
  });

  it('throws if required and not supplied (with dash)', () => {
    getInputSpy.mockImplementation(() => '');
    expect(() => getInputSafe('fail-on', { required: true })).toThrowError(
      'Input required and not supplied: fail-on',
    );
  });

  it('returns empty string if not required and not supplied', () => {
    getInputSpy.mockImplementation(() => '');
    expect(getInputSafe('not-set')).toBe('');
  });

  it('returns value for fallback with required', () => {
    getInputSpy.mockImplementation((name: string) => {
      if (name === 'fail-on') return '';
      if (name === 'fail_on') return 'format';
      return '';
    });
    expect(getInputSafe('fail-on', { required: true })).toBe('format');
  });
});
