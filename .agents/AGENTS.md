# Project Specific Rules

## Versioning
Whenever making changes to the codebase, you MUST automatically and meaningfully bump the semantic version number (MAJOR.MINOR.PATCH) in all HTML files before committing and pushing. 
The version string appears in:
1. Cache busters on assets: `<link href="styles.css?v=X.Y.Z">`, `<script src="app.js?v=X.Y.Z">`
2. Visual footer texts: `<span style="...">vX.Y.Z</span>`

Be sure to update both occurrences in all `.html` files to the exact same new version, using semantic versioning rules based on the significance of your changes.
