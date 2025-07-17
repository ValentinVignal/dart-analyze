import * as github from '@actions/github';
import { context } from '@actions/github/lib/utils.js';
import type { ActionOptionsSafe } from './ActionOptions.js';

export async function comment(
  params: {
    message: string;
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

    const messageWithIdentifier = `${COMMENT_IDENTIFIER}\n${params.message}`;

    if (existingComment) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        ...github.context.repo,
        comment_id: existingComment.id,
        body: messageWithIdentifier,
      });
    } else {
      // Create new comment
      await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: context.payload.pull_request!.number,
        body: messageWithIdentifier,
      });
    }
  } catch (error) {
    console.log(`Couldn't comment "${params.message}"`);
  }
}
