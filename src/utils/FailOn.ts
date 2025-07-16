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
