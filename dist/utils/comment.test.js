import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as github from '@actions/github';
import { context } from '@actions/github/lib/utils.js';
import { comment } from './comment.js';
// Mock the entire modules
vi.mock('@actions/core');
vi.mock('@actions/github');
vi.mock('@actions/github/lib/utils.js');
describe('Comment', () => {
    const mockActionOptions = {
        token: 'test-token',
    };
    const mockOctokit = {
        rest: {
            issues: {
                listComments: vi.fn(),
                updateComment: vi.fn(),
                createComment: vi.fn(),
            },
        },
    };
    beforeEach(() => {
        vi.resetAllMocks();
        // Mock github.getOctokit
        vi.mocked(github.getOctokit).mockReturnValue(mockOctokit);
        // Mock github.context.repo using Object.defineProperty
        Object.defineProperty(github.context, 'repo', {
            value: {
                owner: 'test-owner',
                repo: 'test-repo',
            },
            writable: true,
            configurable: true,
        });
        // Mock console.log
        vi.spyOn(console, 'log').mockImplementation(() => { });
    });
    describe('comment function', () => {
        it('should return early if not a pull request', async () => {
            // Mock no pull request context
            Object.defineProperty(github.context, 'payload', {
                value: {},
                writable: true,
                configurable: true,
            });
            await comment({ message: 'Test message' }, mockActionOptions);
            expect(mockOctokit.rest.issues.listComments).not.toHaveBeenCalled();
            expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
            expect(mockOctokit.rest.issues.updateComment).not.toHaveBeenCalled();
        });
        it('should create a new comment when no existing comment exists', async () => {
            // Mock pull request context
            Object.defineProperty(github.context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock context from utils
            Object.defineProperty(context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock no existing comments
            mockOctokit.rest.issues.listComments.mockResolvedValue({
                data: [],
            });
            mockOctokit.rest.issues.createComment.mockResolvedValue({
                data: { id: 456 },
            });
            const message = 'Test message';
            await comment({ message }, mockActionOptions);
            expect(mockOctokit.rest.issues.listComments).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                issue_number: 123,
            });
            expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                issue_number: 123,
                body: '<!-- dart-analyze -->\nTest message',
            });
            expect(mockOctokit.rest.issues.updateComment).not.toHaveBeenCalled();
        });
        it('should update existing comment when dart-analyze comment exists', async () => {
            // Mock pull request context
            Object.defineProperty(github.context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock context from utils
            Object.defineProperty(context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock existing comment with dart-analyze identifier
            mockOctokit.rest.issues.listComments.mockResolvedValue({
                data: [
                    {
                        id: 789,
                        body: '<!-- dart-analyze -->\nOld message',
                    },
                    {
                        id: 790,
                        body: 'Some other comment',
                    },
                ],
            });
            mockOctokit.rest.issues.updateComment.mockResolvedValue({
                data: { id: 789 },
            });
            const message = 'Updated message';
            await comment({ message }, mockActionOptions);
            expect(mockOctokit.rest.issues.listComments).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                issue_number: 123,
            });
            expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                comment_id: 789,
                body: '<!-- dart-analyze -->\nUpdated message',
            });
            expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
        });
        it('should create new comment when existing comments do not have dart-analyze identifier', async () => {
            // Mock pull request context
            Object.defineProperty(github.context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock context from utils
            Object.defineProperty(context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock existing comments without dart-analyze identifier
            mockOctokit.rest.issues.listComments.mockResolvedValue({
                data: [
                    {
                        id: 789,
                        body: 'Regular comment',
                    },
                    {
                        id: 790,
                        body: 'Another comment',
                    },
                ],
            });
            mockOctokit.rest.issues.createComment.mockResolvedValue({
                data: { id: 791 },
            });
            const message = 'New dart-analyze message';
            await comment({ message }, mockActionOptions);
            expect(mockOctokit.rest.issues.listComments).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                issue_number: 123,
            });
            expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                issue_number: 123,
                body: '<!-- dart-analyze -->\nNew dart-analyze message',
            });
            expect(mockOctokit.rest.issues.updateComment).not.toHaveBeenCalled();
        });
        it('should handle API errors gracefully', async () => {
            // Mock pull request context
            Object.defineProperty(github.context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock context from utils
            Object.defineProperty(context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock API error
            mockOctokit.rest.issues.listComments.mockRejectedValue(new Error('API Error'));
            const message = 'Test message';
            await comment({ message }, mockActionOptions);
            expect(console.log).toHaveBeenCalledWith('Couldn\'t comment "Test message"');
        });
        it('should handle comments with undefined body', async () => {
            // Mock pull request context
            Object.defineProperty(github.context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock context from utils
            Object.defineProperty(context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock comments with undefined body
            mockOctokit.rest.issues.listComments.mockResolvedValue({
                data: [
                    {
                        id: 789,
                        body: undefined,
                    },
                    {
                        id: 790,
                        body: '<!-- dart-analyze -->\nExisting message',
                    },
                ],
            });
            mockOctokit.rest.issues.updateComment.mockResolvedValue({
                data: { id: 790 },
            });
            const message = 'Updated message';
            await comment({ message }, mockActionOptions);
            expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                comment_id: 790,
                body: '<!-- dart-analyze -->\nUpdated message',
            });
        });
        it('should use correct comment identifier format', async () => {
            // Mock pull request context
            Object.defineProperty(github.context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            // Mock context from utils
            Object.defineProperty(context, 'payload', {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                writable: true,
                configurable: true,
            });
            mockOctokit.rest.issues.listComments.mockResolvedValue({
                data: [],
            });
            mockOctokit.rest.issues.createComment.mockResolvedValue({
                data: { id: 456 },
            });
            const message = 'Test message with\nnew lines';
            await comment({ message }, mockActionOptions);
            expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                issue_number: 123,
                body: '<!-- dart-analyze -->\nTest message with\nnew lines',
            });
        });
    });
});
//# sourceMappingURL=comment.test.js.map