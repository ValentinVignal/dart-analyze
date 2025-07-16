import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
import { FailOnEnum } from '../utils/FailOn.js';

export enum DartAnalyzeLogTypeEnum {
  Info = 1,
  Warning = 2,
  Error = 3,
}

/**
 * Represents the key of a Dart analyze log type.
 * This is used to identify the type of log in the `dart analyze` output.
 */
export type DartAnalyzeLogTypeKey = 'INFO' | 'WARNING' | 'ERROR';

export type LogKey = 'WARNING' | 'ERROR';

/**
 * Represents the type of a Dart analyze log.
 */
export class DartAnalyzeLogType {
  public static typeFromKey(
    key: DartAnalyzeLogTypeKey,
  ): DartAnalyzeLogTypeEnum {
    switch (key) {
      case 'ERROR':
        return DartAnalyzeLogTypeEnum.Error;
      case 'WARNING':
        return DartAnalyzeLogTypeEnum.Warning;
      default:
        return DartAnalyzeLogTypeEnum.Info;
    }
  }

  /**
   *
   * @param logType
   * @returns The Github key for the log type.
   */
  public static keyFromType(logType: DartAnalyzeLogTypeEnum): LogKey {
    switch (logType) {
      case DartAnalyzeLogTypeEnum.Error:
        return 'ERROR';
      default:
        return 'WARNING';
    }
  }

  /**
   * Checks if the log type should cause the action to fail.
   */
  public static isFail(
    actionOptions: ActionOptionsSafe,
    logType: DartAnalyzeLogTypeEnum,
  ): boolean {
    switch (actionOptions.failOn) {
      case FailOnEnum.Nothing:
        return false;
      case FailOnEnum.Format:
        return false;
      case FailOnEnum.Info:
        return true;
      case FailOnEnum.Warning:
        return (
          logType === DartAnalyzeLogTypeEnum.Error ||
          logType === DartAnalyzeLogTypeEnum.Warning
        );
      case FailOnEnum.Error:
      default:
        return logType === DartAnalyzeLogTypeEnum.Error;
    }
  }

  /**
   * Converts the log type to a string.
   */
  public static typeToString(logType: DartAnalyzeLogTypeEnum): string {
    switch (logType) {
      case DartAnalyzeLogTypeEnum.Info:
        return 'Info';
      case DartAnalyzeLogTypeEnum.Warning:
        return 'Warning';
      case DartAnalyzeLogTypeEnum.Error:
        return 'Error';
    }
  }
}
