"use strict";

var Promise = require("bluebird"); // jshint ignore:line

var promisify = require("../lib/promisify");
var path = require("path");
var fs = Promise.promisifyAll(require("fs"));
function backupRepo(url, destinationDir, dry_run) {
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
		if(dry_run) return Promise.resolve();
		return promisify.exec("git", ["remote", "update"], { cwd: repoPath });
	}, function() {
		console.log("Cloning", url);
		if(dry_run) return Promise.resolve();
		return promisify.exec("git", ["clone", "--mirror", url, repoPath]);
	});
}

function backupRepoSerialized(url, destinationDir, promise, dry_run) {
	if (promise) {
		return promise.then(function() {
			return backupRepo(url, destinationDir, dry_run);
		});
	} else {
		return backupRepo(url, destinationDir, dry_run);
	}
}

var github = require("../lib/github");
function publicUserRepos(args) {
	var username = args.username;
	var destinationDir = args.path; 
	return github.getPublicUserRepos(username, args.include).then(function(repos) {
		var promise;
		for (var i = 0; i < repos.length; i++) {
			var url = repos[i].clone_url; // jshint ignore:line
			promise = backupRepoSerialized(url, destinationDir, promise, args.dry_run);
		}
		return promise;
	});
}

module.exports = {
	publicUserRepos: publicUserRepos
};
