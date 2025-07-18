import * as github from '@actions/github';
import { context } from '@actions/github/lib/utils.js';
import type { ActionOptionsSafe } from './ActionOptions.js';

/**
 * Post a comment on the pull request with the given message.
 *
 * Attempts the update an existing comment if it finds one, otherwise creates a new comment.
 *
 * If {@link message} is not provided, it will
 * - do nothing if there is no existing comment,
 * - or update the existing comment with a resolved message.
 */

export async function comment(
  {
    message,
  }: {
    message?: string;
  },
  actionOptions: ActionOptionsSafe,
): Promise<void> {
  if (!github.context.payload.pull_request) {
    // Can only comment on Pull Requests
    return;
  }
  const octokit = github.getOctokit(actionOptions.token);

  // Create or update the comment
  try {
    // Get all comments on the PR
    const comments = await octokit.rest.issues.listComments({
      ...github.context.repo,
      issue_number: context.payload.pull_request!.number,
    });

    // Find existing comment from this specific action (using a unique identifier)
    const COMMENT_IDENTIFIER = '<!-- dart-analyze -->';
    const existingComment = comments.data.find((comment) =>
      comment.body?.includes(COMMENT_IDENTIFIER),
    );

    const messageWithIdentifier = `${COMMENT_IDENTIFIER}\n${message ?? successMessage(actionOptions)}`;

    if (existingComment) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        ...github.context.repo,
        comment_id: existingComment.id,
        body: messageWithIdentifier,
      });
    } else if (message) {
      // Create new comment
      await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: context.payload.pull_request!.number,
        body: messageWithIdentifier,
      });
    }
  } catch (error) {
    console.log(`Couldn't comment "${message}"`);
  }
}

const successMessage = (actionOptions: ActionOptionsSafe): string => {
  const icon = actionOptions.emojis ? ':white_check_mark: ' : '';
  return `**Dart analyze** completed successfully\n${icon}All issues have been resolved.`;
};
