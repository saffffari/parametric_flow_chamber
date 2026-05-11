# Contributing

This is the paper companion for the Parametric Flow Chamber. It is maintained primarily as the canonical archive of the published system, not as an actively-developed product. That said, contributions that improve replicability, fix errors, or extend documentation are very welcome.

## How to contribute

- **Found a bug or documentation error?** Open a GitHub issue (use the bug-report template). Include your environment (OS, Python/Node version, firmware revision) and a reproducible case.
- **Have a hardware question?** Open an issue with the hardware-question template — channel geometry, machining tolerance, sterility, microscope compatibility, sourcing alternatives. Include your microscope and pump details.
- **Have a code or doc improvement?** Pull requests welcome on `firmware/`, `app/`, and `docs/`. Smaller PRs are easier to review than large ones.
- **Have a research extension?** If you've adapted the chamber for a different cell line, scope, or assay and would like to be cited, open an issue describing your work — we may add a "Related work" section to the docs or link your fork.

## What's out of scope

- Adding new commercial part dependencies (e.g. proprietary MCUs, closed software stacks). The build is intentionally open and replicable from off-the-shelf parts.
- Changes that break replicability against the published paper measurements (e.g. silently changing channel dimensions or media viscosity).

## Contact

Maintainer: Alexander Saffari ([ORCID 0009-0006-3773-902X](https://orcid.org/0009-0006-3773-902X)).

For paper-related questions (data, methods, statistics), the corresponding author and affiliated lab contact is listed in the paper.
