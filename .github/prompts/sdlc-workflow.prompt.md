---
name: SDLC Workflow
description: "Orchestrate the approved capstone SDLC from a user story through requirements, design, implementation, review, verification, release preparation, and final documentation."
argument-hint: "Paste the user story to process through the approved SDLC workflow."
agent: agent
tools: [read, edit, search, execute, github-mcp-server/*]
---

# Capstone SDLC Workflow

Run the staged SDLC workflow for this user story:

${input:userStory}

Use the existing custom agents by their available names: **Requirements Analyst**, **Architect**, **Design Reviewer**, **Implementation Planner**, **Implementer**, **Code Reviewer**, **Verifier**, **Release Preparer**, and **Documentation Agent**. Their definitions are in `.github/agents/`. Follow those definitions for role-specific instructions; do not duplicate or override them.

## Repository and branch targeting

- The only target repository is `KusumaPriya-2005/Github_Capstone_Project` (`https://github.com/KusumaPriya-2005/Github_Capstone_Project`); every pull request must use `main` as its base.
- Before creating or editing any workflow artifacts, verify the current workspace is a Git worktree whose `origin` remote resolves to that exact repository. Use the configured `github-mcp-server` tools to verify the repository identity and inspect its default/base branch when those tools are available. Do not mistake a default-branch label for proof that the branch exists. If the worktree/remote is absent or mismatched, or `main` does not exist, stop and ask the user to open/populate the correct repository or resolve the mismatch; do not generate project changes in a different workspace.
- Before any workflow file changes, inspect the working tree. Preserve all pre-existing user changes and never stash, discard, reset, or overwrite them. If they prevent safe branch creation or switching, stop and ask the user.
- For each workflow run, use a new, unique local feature branch based on `main`, named `sdlc/<short-story-slug>-<unique-run-id>`. Generate the run ID once at the beginning, record it in handoffs, and never reuse an existing branch. Confirm the current branch and base before editing. If a unique branch cannot be safely created from `main`, stop rather than continue on another branch.
- Use `github-mcp-server` for GitHub operations it actually supports (such as repository/branch inspection). Use only available Git tools for local branch operations. Never assume an MCP operation exists; if a required remote write or PR-creation operation is unavailable or permissions deny it, stop and report the blocker rather than simulating success.
- Creating/pushing a branch and creating/publishing a PR are remote side effects. Ask for explicit user authorization before pushing or creating/publishing; approval to run the SDLC workflow alone does not authorize those actions.

## Orchestration rules

- Invoke/delegate to a named custom agent only if the current Copilot environment actually provides a supported way to do so. Do not assume a tool, command, or programmatic invocation mechanism exists. If it does not, stop and tell the user which named agent to run next and what handoff information to provide; do not impersonate that agent or claim its work was performed.
- Execute stages in the numbered order below. Do not start a downstream stage until its prerequisites and approval gates are satisfied.
- At every stage, inspect existing target files and relevant working-tree changes before editing. Preserve unrelated user changes; never overwrite conflicting content without first resolving the conflict with the user.
- Treat missing artifacts, unclear approval, unsupported agent invocation, failed checks, and unresolved blockers as blockers. Stop at the relevant gate, explain the evidence and decision needed, and ask the user before proceeding. Do not infer approval from silence or from an earlier unrelated authorization.
- Never invent requirements, decisions, approvals, findings, file changes, test results, release state, or PR URLs. Clearly label unavailable or unverified information.

## Ordered workflow and gates

1. **Requirements Analyst** — Pass the user story above to the agent. It must identify ambiguities, ask clarification questions, wait for answers, present the resulting requirements for explicit user confirmation, and only then finalize repository-root `requirements.md`. If clarification or confirmation is pending, stop here.
2. **Architect** — After requirements are confirmed, have the agent read approved `requirements.md` and create repository-root `architecture.md`. The architecture is proposed, not approved, until the next human gate.
3. **Design Reviewer** — Have the agent compare `architecture.md` with `requirements.md` and create/update repository-root `design-review.md`, including findings, severity, resolutions/status, and decisions. Present the review and obtain explicit human approval of the design. If approval is absent, a blocking finding remains, or required revisions are pending, stop; do not plan or implement.
4. **Implementation Planner** — Only after the required human approvals and design-review conditions are satisfied, have the agent create/update repository-root `impl-plan.md` with prioritized tasks, dependencies, expected files, and completion criteria. Stop if any task is blocked or an approval gate is unmet.
5. **Implementer** — Have the agent implement only approved, unblocked tasks in `impl-plan.md`, following the approved architecture and preserving unrelated changes. If new scope or a design decision is needed, stop for human approval rather than expanding the task.
6. **Code Reviewer** — Have the read-only reviewer inspect the actual changes against the approved requirements, architecture, plan, and design decisions. If there are blocking findings, send only approved, planned fixes back to the Implementer; then rerun Code Reviewer on the updated changes. Repeat until blocking findings are resolved, or stop and ask the user if a fix requires approval or replanning.
7. **Verifier** — Have the agent run applicable checks and create/update repository-root `verification.md` with exact commands, actual results, failures, and limitations. Do not report success when checks fail, are blocked, or cannot run. If a failure needs an implementation change, return to the Implementer only for an approved, unblocked task, then repeat Code Reviewer and Verifier on the resulting changes. Stop if required checks fail or remain blocked; accurately report non-blocking limitations.
8. **Release Preparer** — After applicable review and verification gates pass, have the agent prepare/update root-level `CHANGELOG.md` and `PULL_REQUEST.md`. The PR description must include **Summary**, **Changes Made**, **Test Evidence**, **Known Limitations**, and **Reviewer Checklist**. This is draft preparation only unless the user separately gives explicit authorization to create or publish a PR.
9. **Documentation Agent** — Run after all preceding applicable agent work. Have it create/update the single repository-root `documentation.md`, consolidating the user story, available SDLC artifacts, implementation and changed files, review findings/resolutions, actual verification evidence, known limitations, release details, and PR status. It must distinguish completed, pending, blocked, and unverified items.

## Final documentation and PR safeguards

- If `documentation.md` or any other post-review file change is included in the intended PR, the final contents of those changed files must be reviewed and verified before PR creation. After any such edit, rerun **Code Reviewer** and **Verifier** on the final diff; resolve blocking findings and rerun checks as needed. Refresh `PULL_REQUEST.md` with actual final changes and evidence through **Release Preparer** when necessary.
- If post-documentation review, verification, release, or publication work is required, do not claim that the Documentation Agent ran last. Once those stages finish, have the Documentation Agent consolidate their actual results. If that final consolidation changes a file intended for the PR, review and verify that final change before PR creation. Continue only when the documentation included in the PR is the same content that passed review and verification; otherwise stop and report the remaining gate.
- Do not create, publish, push, or otherwise submit a PR without explicit user authorization for that consequential action and completion of all required human approval, review, and verification gates. The PR head must be the unique feature branch for this run in the target repository; the base must be `main`. Before acting, confirm that authorization clearly covers the specific PR action and verify the actual head/base/repository with available GitHub MCP operations. Never invent a PR URL or claim a PR was created, published, or merged without evidence.
- If the user has authorized PR creation, ensure all PR-included documentation has passed the final review and verification before asking **Release Preparer** to create/publish it. If the configured GitHub MCP server does not expose a supported PR-creation operation or denies access, stop and report that; do not claim creation. After creation, record only the actual PR URL and observed status in `documentation.md`; any changed documentation must again be reviewed and verified. If this means the Documentation Agent was followed by another required stage, say so plainly and do not claim it ran last.

## Completion report

Summarize which agents actually ran, the artifacts actually created or updated, the user approvals received, review and verification outcomes, unresolved or unverified work, and the actual release/PR status. Clearly state where the workflow stopped if any gate remains unmet.
