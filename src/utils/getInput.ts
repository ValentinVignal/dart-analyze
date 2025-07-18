/**
 *  Get the input as a string from the environment variables.
 */
export const getInputString = (name: string): string | undefined => {
  const names = [name, name.replace(/-/g, '_')].map(
    (name) => `INPUT_${name.toUpperCase()}`,
  );
  for (const envName of names) {
    const value = process.env[envName];
    if (value !== undefined) {
      return value.trim();
    }
  }
};

/**
 * Get the input as a number from the environment variables.
 */
export const getInputNumber = (name: string): number | undefined => {
  const value = getInputString(name);
  if (value === undefined) {
    return undefined;
  }
  return parseInt(value);
};

/**
 * Get the input as a multiline string from the environment variables.
 */
export const getInputMultilineString = (name: string): string[] | undefined => {
  const value = getInputString(name);
  if (value === undefined) {
    return undefined;
  }
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};
