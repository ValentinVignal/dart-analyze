export class FailOn {
  /**
   * Create a {@link FailOnEnum} from a string input.
   *
   * Defaults is {@link FailOnEnum.Warning}.
   */
  static fromInput(input?: string): FailOnEnum {
    switch (input) {
      case 'nothing':
        return FailOnEnum.Nothing;
      case 'format':
        return FailOnEnum.Format;
      case 'info':
        return FailOnEnum.Info;
      case 'warning':
        return FailOnEnum.Warning;
      default:
        return FailOnEnum.Warning;
    }
  }
}

/**
 * Enum representing the different fail conditions for the action.
 */
export enum FailOnEnum {
  /**
   * Fail on error logs.
   */
  Error = 0,
  /**
   * Fail on warning logs.
   *
   * This is the default behavior.
   */
  Warning = 1,
  /**
   * Fail on info logs.
   *
   * This is useful for strict linting policies.
   */
  Info = 2,
  /**
   * Fail on format issues.
   */
  Format = 3,
  /**
   * Do not fail the action regardless of the logs.
   */
  Nothing = 4,
}
