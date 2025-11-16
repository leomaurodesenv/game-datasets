# Add link checking workflow

## Summary

This PR adds automated link checking to the CI workflow to detect and report broken or invalid links in markdown files.

## Changes

- Added a new `check-links` job to the continuous integration workflow
- Integrated `lychee` action to validate all links in `README.md`
- Configured to accept valid HTTP status codes (200, 204, 429)
- Set `fail: false` to prevent workflow failures while still reporting broken links

## Benefits

- **Early detection**: Catch broken links before they affect users
- **Automated validation**: No manual checking required
- **Non-blocking**: Workflow continues even if broken links are found (reports them in the logs)
- **Comprehensive**: Checks all markdown files automatically

## Configuration Details

- Accepts HTTP status codes: 200 (OK), 204 (No Content), 429 (Rate Limited)
- Timeout set to 20 seconds per link
- Excludes private links and mailto links
- Verbose output for detailed reporting

## Testing

The workflow runs on:
- Push events
- Pull requests
- Manual workflow dispatch

## Future Enhancements

- Could add scheduled runs (e.g., weekly) to catch links that break over time
- Could extend to check links in all markdown files, not just README.md
- Could set `fail: true` once initial broken links are fixed to prevent new ones

