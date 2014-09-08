# github-install

Backup GitHub repositories locally. This tool mirrors all public repositories of a GitHub user and all of the organizations that user is publicly a member of. If the repositories already exist on disk, they are updated. This script is meant to be run as a cron job.

The program uses the [GitHub API](https://developer.github.com/) to discover repositories, and by default it accesses it unauthenticated, [which subjects it to lower rate limits](https://developer.github.com/v3/#rate-limiting). For most people running this every few hours won't be a problem. If you start getting 403 Forbidden errors, you can create a [personal access token](https://github.com/settings/applications) and store it in the GITHUB_ACCESS_TOKEN environment variable to get a higher rate limit.

# Installation

1. Install [Node.js](http://nodejs.org/)
2. Run `npm install -g github-install`

# Usage

```
$ github-backup username path
```

# To-do

1. Add ability to specify single individual repository as in "user/repository" or "organization/repository".
2. Discover and backup private repositories.
