# Feedback Channels

MengXi Ark adopts a dual-track feedback mechanism — "Issues for problems, Discussions for ideas". Feedback is welcome throughout the public beta (`1.0.0-beta.x`).

## Issues (Bugs & Feature Requests)

Please submit via the templates for quick triage and response:

| Template | When to Use |
| --- | --- |
| [Bug Report](https://github.com/MengXi-Studio/mengxi-ark/issues/new?template=bug_report.md) | Component / hook / base behavior doesn't match the docs or throws errors |
| [Feature Request](https://github.com/MengXi-Studio/mengxi-ark/issues/new?template=feature_request.md) | Suggestions for new components, hooks, or capabilities |
| [Docs Feedback](https://github.com/MengXi-Studio/mengxi-ark/issues/new?template=docs_feedback.md) | Documentation errors, non-runnable examples |

When filing a bug, please include: framework package versions (`pnpm list @mengxi-ark/utils`), Vue / UI library versions, and a minimal reproduction or screenshots.

## Discussions (Community & Announcements)

- **Release notes**: changes and migration highlights of every Release are published in [Discussions](https://github.com/MengXi-Studio/mengxi-ark/discussions);
- **Usage topics**: open discussions on integration approaches, dual-mode choices, base extensions, etc.;
- **Roadmap discussions**: feedback on milestone planning.

## Contributing Fixes

PRs are welcome: fork → `fix/*` or `feature/*` branch → link an Issue → once CI is green, a maintainer reviews and merges. See [CONTRIBUTING](https://github.com/MengXi-Studio/mengxi-ark/blob/master/CONTRIBUTING.md) for the process.

## Upgrade Notes

- Beta versions (`1.0.0-beta.x`) are distributed via the npm `beta` dist-tag: `pnpm add @mengxi-ark/utils@beta`;
- Minor API tweaks are allowed during the Beta; all breaking changes and migration steps will be listed in the release announcement before the official v1.0.0.
