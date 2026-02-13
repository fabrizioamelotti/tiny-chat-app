/**
 * Gets the environment variable value by key
 *
 * @example
 * If the env variable exists -> env variable value
 * demandEnv("MY_VARIABLE")
 *
 * If the env variable doesn't exist
 *    & defaultValue is provided -> defaultValue
 *      demandEnv("MY_VARIABLE", "default-value")
 *
 *    & no defaultValue is provided -> throw an error
 *      demandEnv("MISSING_VARIABLE")
 *
 * @param {string} key Environment variable key
 * @param {string|undefined} defaultValue Default value if the environment variable doesn't exist
 * @returns {string} Environment variable value or the default value
 * @throws {Error} if the environment variable is missing and if the defaultValue is not provided
 */
export function demandEnv(key: string, defaultValue?: string): string {
  const value: string | undefined = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required.`);
  }

  return value;
}
