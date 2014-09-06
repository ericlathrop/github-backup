"use strict";

var Promise = require("bluebird"); // jshint ignore:line

/*
 * A GitHub Access Token for higher API rate limits.
 * You can generate on on https://github.com/settings/applications#personal-access-tokens
 */
var accessToken = process.env.GITHUB_ACCESS_TOKEN;

var promisify = require("../lib/promisify");
var github = require("../lib/github");

var path = require("path");
var fs = Promise.promisifyAll(require("fs"));
function backupRepo(repo, destinationDir) {
	var url = repo.clone_url; // jshint ignore:line
	var re = new RegExp("https://github\\.com/([^/]+)/([^/]+)");
	var matches = url.match(re);
	var user = matches[1];
	var repoName = matches[2];
	var userPath = path.join(destinationDir, user);
	var repoPath = path.join(userPath, repoName);

	return fs.statAsync(userPath).error(function() {
		return fs.mkdirAsync(userPath);
	}).then(function() {
		return fs.statAsync(repoPath);
	}).then(function() {
		console.log("Updating", url);
		return promisify.exec("git", ["remote", "update"], { cwd: repoPath });
	}, function() {
		console.log("Cloning", url);
		return promisify.exec("git", ["clone", "--mirror", url, repoPath]);
	});
}

function backupRepoSerialized(repo, destinationDir, promise) {
	if (promise) {
		return promise.then(function() {
			return backupRepo(repo, destinationDir);
		});
	} else {
		return backupRepo(repo, destinationDir);
	}
}

function backupPublicUserRepos(username, destinationDir) {
	github.getPublicUserRepos(username).then(function(repos) {
		var promise;
		for (var i = 0; i < repos.length; i++) {
			var repo = repos[i];
			promise = backupRepoSerialized(repo, destinationDir, promise);
		}
		return promise;
	}, function(err) {
		console.error("Unhandled error:", err);
	}).done();
}

function main(argv) {
	var args = argv.slice(2);
	if (args.length !== 2) {
		console.error("Usage: github-backup username path");
		process.exit(-1);
	}
	backupPublicUserRepos(args[0], args[1]);
}
main(process.argv);
