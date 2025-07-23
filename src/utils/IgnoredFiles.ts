import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Minimatch } from 'minimatch';
import * as path from 'path';
import type { ActionOptionsSafe } from './ActionOptions.js';

type AnalysisOptions = {
  include?: string;
  analyzer?: {
    exclude?: string[] | string;
  };
};

/**
 * The ignore files in the analysis_options.yaml
 */
export class IgnoredFiles {
  private readonly patterns: Minimatch[];
  constructor(actionOptions: ActionOptionsSafe) {
    let patterns: string[];
    try {
      const yamlPath = IgnoredFiles.findClosestYamlFile(
        actionOptions.workingDirectory,
      );
      if (!yamlPath) {
        throw new Error(
          `Could not find any "analysis_options.yaml" in the parent directories of "${actionOptions.workingDirectory}"`,
        );
      }
      patterns = IgnoredFiles.getIgnoredPatterns(yamlPath);
    } catch (error) {
      console.error('Could not load analysis_options.yaml:\n', error);
    }
    patterns ??= [];
    this.patterns = patterns.map((pattern) => new Minimatch(pattern));
  }

  /**
   *
   * @param path
   */
  private static findClosestYamlFile(directoryPath: string): string | null {
    const yamlPath = path.resolve(directoryPath, 'analysis_options.yaml');
    if (fs.existsSync(yamlPath)) {
      return yamlPath;
    } else {
      const parentDirectoryPath = path.resolve(directoryPath, '..');
      if (parentDirectoryPath === directoryPath) {
        return null;
      } else {
        return IgnoredFiles.findClosestYamlFile(parentDirectoryPath);
      }
    }
  }

  private static getIgnoredPatterns(yamlPath: string): string[] {
    const yamlFile = yaml.load(
      fs.readFileSync(yamlPath, 'utf8'),
    ) as AnalysisOptions;
    const exclude = yamlFile?.analyzer?.exclude;
    let patterns: string[];
    if (exclude) {
      if (Array.isArray(exclude)) {
        patterns = exclude;
      } else if (typeof exclude === 'string') {
        patterns = [exclude];
      }
    }
    patterns ??= [];

    if (yamlFile?.include) {
      const newPath = path.resolve(path.dirname(yamlPath), yamlFile.include);
      if (fs.existsSync(newPath)) {
        return [...IgnoredFiles.getIgnoredPatterns(newPath), ...patterns];
      }
    }
    return patterns;
  }

  /**
   * Whether a file is ignored
   */
  public has(file: string): boolean {
    return this.patterns.some((pattern) => pattern.match(file));
  }
}
