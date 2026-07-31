<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cost safety

- Never take an action that can incur a charge for this project.
- Use local development and free tooling only. Do not create or deploy paid infrastructure, services, domains, or subscriptions.

# Code quality

- Apply continuous refactoring pressure whenever code is touched: improve naming, responsibility boundaries, duplication, and oversized files within the task's scope.
- Keep refactors incremental and behavior-preserving; do not expand into unrelated rewrites.
- Treat line counts as review signals, not goals. Prefer pages at 300 lines or fewer, React components at 200 lines or fewer, hooks/services/API routes at 200 lines or fewer, utilities at 150 lines or fewer, and functions at 50 lines or fewer.
- Reassess responsibility boundaries above 300 lines. Files above 500 lines must be split unless they have a strong, documented single-responsibility reason to remain together.
- Split below those limits when UI and API access are mixed, form handling/validation/transformation are combined, many small components accumulate, understanding requires repeated scrolling, or a large function is difficult to name.
- Give each file one role that can be explained in a single sentence. Avoid fragmentation that only reduces line counts and makes the flow harder to follow.
