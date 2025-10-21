import {
    BaseService,
    Action,
    Reaction,
    ServiceExecutionContext
} from "./types";

class GitHubService extends BaseService {
    constructor() {
        const actions: Action[] = [
            {
                name: "new_pull_request",
                description:
                    "Triggered when a new pull request is opened on a repository",
                parameters: [
                    {
                        name: "repo_owner",
                        type: "string",
                        description: "Repository owner",
                        required: true
                    },
                    {
                        name: "repo_name",
                        type: "string",
                        description: "Repository name",
                        required: true
                    },
                    {
                        name: "base_branch",
                        type: "string",
                        description:
                            "Only PRs targeting this branch (optional)",
                        required: false
                    },
                    {
                        name: "label_filter",
                        type: "string",
                        description: "Only PRs with this label (optional)",
                        required: false
                    }
                ],
                execute: async (params, context) => {
                    return this.getNewPullRequests(params, context);
                }
            },
            {
                name: "issue_comment_added",
                description:
                    "Triggered when a new comment is added to an issue or PR",
                parameters: [
                    {
                        name: "repo_owner",
                        type: "string",
                        description: "Repository owner",
                        required: true
                    },
                    {
                        name: "repo_name",
                        type: "string",
                        description: "Repository name",
                        required: true
                    },
                    {
                        name: "issue_number",
                        type: "number",
                        description: "Issue/PR number",
                        required: true
                    }
                ],
                execute: async (params, context) => {
                    return this.getNewComments(params, context);
                }
            }
        ];

        const reactions: Reaction[] = [
            {
                name: "create_issue",
                description: "Create a new issue in a repository",
                parameters: [
                    {
                        name: "repo_owner",
                        type: "string",
                        description: "Repository owner",
                        required: true
                    },
                    {
                        name: "repo_name",
                        type: "string",
                        description: "Repository name",
                        required: true
                    },
                    {
                        name: "title",
                        type: "string",
                        description: "Issue title",
                        required: true
                    },
                    {
                        name: "body",
                        type: "string",
                        description: "Issue body (optional)",
                        required: false
                    },
                    {
                        name: "labels",
                        type: "string",
                        description: "Comma-separated labels (optional)",
                        required: false
                    }
                ],
                execute: async (params, context) => {
                    // use context.userTokens.github to call GitHub API:
                    // POST /repos/:owner/:repo/issues
                    // return nothing (or throw on error)
                    throw new Error("Implement GitHub API call here");
                }
            },
            {
                name: "add_label_to_issue",
                description: "Add a label to an issue or PR",
                parameters: [
                    {
                        name: "repo_owner",
                        type: "string",
                        description: "Repository owner",
                        required: true
                    },
                    {
                        name: "repo_name",
                        type: "string",
                        description: "Repository name",
                        required: true
                    },
                    {
                        name: "issue_number",
                        type: "number",
                        description: "Issue/PR number",
                        required: true
                    },
                    {
                        name: "label",
                        type: "string",
                        description: "Label to add",
                        required: true
                    }
                ],
                execute: async (params, context) => {
                    // use context.userTokens.github to call:
                    // POST /repos/:owner/:repo/issues/:issue_number/labels
                    throw new Error("Implement GitHub API call here");
                }
            }
        ];

        super("GitHub", actions, reactions);
    }

    async initialize(): Promise<void> {
        // Any initialization logic if needed
        console.log(`${this.name} service initialized`);
    }

    private async getNewPullRequests(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<unknown | null> {
        console.log("Checking for new pull requests with filters:", params);
        if (!context || !context.userTokens.github) {
            if (!context) console.error("No context provided");
            console.debug(context);
            throw new Error(
                "GitHub OAuth token required to check pull requests"
            );
        }
        const owner = params.repo_owner as string;
        const repo = params.repo_name as string;
        const base = params.base_branch as string | undefined;
        const labelFilter = params.label_filter as string | undefined;

        try {
            const { Octokit } = await import("@octokit/rest");
            const github = new Octokit({ auth: context.userTokens.github });

            // Determine last checked time (default to 24 hours ago like Gmail)
            const lastChecked = params.lastTriggered
                ? new Date(params.lastTriggered as string)
                : new Date(Date.now() - 24 * 60 * 60 * 1000);
            console.log(
                `Checking for PRs updated after ${lastChecked.toISOString()}`
            );

            // Use the pulls.list endpoint but filter by since using search if needed.
            // The REST pulls.list doesn't accept 'since', so use the search API to find PRs updated after timestamp.
            const iso = lastChecked.toISOString();
            // Build search query: type:pr repo:owner/repo updated:>YYYY-MM-DDTHH:MM:SSZ
            let q = `type:pr repo:${owner}/${repo} updated:>${iso}`;
            if (base) q += ` base:${base}`;
            if (labelFilter) q += ` label:${labelFilter}`;

            const searchRes = await github.request("GET /search/issues", {
                q,
                sort: "updated",
                order: "desc",
                per_page: 10
            });

            const items = searchRes.data.items;
            if (!items || items.length === 0) {
                console.log("No new pull requests found");
                return null;
            }

            // Return the most recent PR (search returns issues+PRs; items with pull_request are PRs)
            const latest = items[0];

            // Map to a compact PR object similar to Gmail implementation
            return {
                id: latest.id,
                number: latest.number,
                title: latest.title,
                body: latest.body || "",
                url: latest.html_url,
                user: latest.user,
                labels: latest.labels,
                updated_at: latest.updated_at,
                created_at: latest.created_at
            };
        } catch (error) {
            console.error("Error checking pull requests:", error);
            return null; // Don't trigger on API errors
        }
    }

    private async getNewComments(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<unknown | null> {
        console.log("Checking for new comments with filters:", params);
        if (!context || !context.userTokens.github) {
            if (!context) console.error("No context provided");
            console.debug(context);
            throw new Error("GitHub OAuth token required to check comments");
        }
        const owner = params.repo_owner as string;
        const repo = params.repo_name as string;
        const issueNumber = params.issue_number as number;

        try {
            const { Octokit } = await import("@octokit/rest");
            const github = new Octokit({ auth: context.userTokens.github });

            const lastChecked = params.lastTriggered
                ? new Date(params.lastTriggered as string)
                : new Date(Date.now() - 24 * 60 * 60 * 1000);
            console.log(
                `Checking for comments updated after ${lastChecked.toISOString()}`
            );

            const commentsRes = await github.request(
                "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
                {
                    owner,
                    repo,
                    issue_number: issueNumber
                }
            );

            const items = commentsRes.data;
            if (!items || items.length === 0) {
                console.log("No new comments found");
                return null;
            }

            // Return the most recent comment
            const latest = items[0];
            return {
                id: latest.id,
                body: latest.body || "",
                url: latest.html_url,
                user: latest.user,
                created_at: latest.created_at
            };
        } catch (error) {
            console.error("Error checking comments:", error);
            return null; // Don't trigger on API errors
        }
    }
}

export default GitHubService;
