import { describe, expect, it } from 'vitest';
import { FailOnEnum } from '../utils/FailOn.js';
import {
  DartAnalyzeLogType,
  DartAnalyzeLogTypeEnum,
} from './DartAnalyzeLogType.js';

const mockOptions = (failOn: FailOnEnum) => ({ failOn }) as any;

describe('DartAnalyzeLogType', () => {
  it('typeFromKey returns correct enum', () => {
    expect(DartAnalyzeLogType.typeFromKey('ERROR')).toBe(
      DartAnalyzeLogTypeEnum.Error,
    );
    expect(DartAnalyzeLogType.typeFromKey('WARNING')).toBe(
      DartAnalyzeLogTypeEnum.Warning,
    );
    expect(DartAnalyzeLogType.typeFromKey('INFO')).toBe(
      DartAnalyzeLogTypeEnum.Info,
    );
    expect(DartAnalyzeLogType.typeFromKey('OTHER' as any)).toBe(
      DartAnalyzeLogTypeEnum.Info,
    );
  });

  it('keyFromType returns correct key', () => {
    expect(DartAnalyzeLogType.keyFromType(DartAnalyzeLogTypeEnum.Error)).toBe(
      'ERROR',
    );
    expect(DartAnalyzeLogType.keyFromType(DartAnalyzeLogTypeEnum.Warning)).toBe(
      'WARNING',
    );
    expect(DartAnalyzeLogType.keyFromType(DartAnalyzeLogTypeEnum.Info)).toBe(
      'NOTICE',
    );
    expect(DartAnalyzeLogType.keyFromType(DartAnalyzeLogTypeEnum.Note)).toBe(
      'NOTICE',
    );
  });

  it('typeToString returns correct string', () => {
    expect(DartAnalyzeLogType.typeToString(DartAnalyzeLogTypeEnum.Error)).toBe(
      'Error',
    );
    expect(
      DartAnalyzeLogType.typeToString(DartAnalyzeLogTypeEnum.Warning),
    ).toBe('Warning');
    expect(DartAnalyzeLogType.typeToString(DartAnalyzeLogTypeEnum.Info)).toBe(
      'Info',
    );
    expect(DartAnalyzeLogType.typeToString(DartAnalyzeLogTypeEnum.Note)).toBe(
      'Note',
    );
  });

  it('isFail returns correct value for each failOn', () => {
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Nothing),
        DartAnalyzeLogTypeEnum.Error,
      ),
    ).toBe(false);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Note),
        DartAnalyzeLogTypeEnum.Error,
      ),
    ).toBe(true);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Info),
        DartAnalyzeLogTypeEnum.Error,
      ),
    ).toBe(true);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Warning),
        DartAnalyzeLogTypeEnum.Error,
      ),
    ).toBe(true);

    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Error),
        DartAnalyzeLogTypeEnum.Error,
      ),
    ).toBe(true);

    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Nothing),
        DartAnalyzeLogTypeEnum.Warning,
      ),
    ).toBe(false);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Note),
        DartAnalyzeLogTypeEnum.Warning,
      ),
    ).toBe(true);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Info),
        DartAnalyzeLogTypeEnum.Warning,
      ),
    ).toBe(true);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Warning),
        DartAnalyzeLogTypeEnum.Warning,
      ),
    ).toBe(true);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Error),
        DartAnalyzeLogTypeEnum.Warning,
      ),
    ).toBe(false);

    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Nothing),
        DartAnalyzeLogTypeEnum.Info,
      ),
    ).toBe(false);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Note),
        DartAnalyzeLogTypeEnum.Info,
      ),
    ).toBe(true);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Info),
        DartAnalyzeLogTypeEnum.Info,
      ),
    ).toBe(true);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Warning),
        DartAnalyzeLogTypeEnum.Info,
      ),
    ).toBe(false);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Error),
        DartAnalyzeLogTypeEnum.Info,
      ),
    ).toBe(false);

    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Nothing),
        DartAnalyzeLogTypeEnum.Note,
      ),
    ).toBe(false);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Note),
        DartAnalyzeLogTypeEnum.Note,
      ),
    ).toBe(true);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Info),
        DartAnalyzeLogTypeEnum.Note,
      ),
    ).toBe(false);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Warning),
        DartAnalyzeLogTypeEnum.Note,
      ),
    ).toBe(false);
    expect(
      DartAnalyzeLogType.isFail(
        mockOptions(FailOnEnum.Error),
        DartAnalyzeLogTypeEnum.Note,
      ),
    ).toBe(false);
  });
});
