import * as core from '@actions/core';
/**
 *
 * Used to get the input from the action. Using the action from the market place
 * with set environment variables like `INPUT_FAIL-ON`, but using the shell
 * script will set environment variable like `INPUT_FAIL_ON`. This function
 * returns the value of the input, no matter how it was set.
 */
export declare const getInputSafe: (name: string, options?: core.InputOptions) => string;
//# sourceMappingURL=getInput.d.ts.map