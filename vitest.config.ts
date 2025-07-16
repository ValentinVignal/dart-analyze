import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: ['default', 'json', 'junit'],
    outputFile: './test-report.junit.xml',
  },
});
