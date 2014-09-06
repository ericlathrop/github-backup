"use strict";

var Promise = require("bluebird"); // jshint ignore:line

var promisify = require("../lib/promisify");
var path = require("path");
var fs = Promise.promisifyAll(require("fs"));
function backupRepo(url, destinationDir) {
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

function backupRepoSerialized(url, destinationDir, promise) {
	if (promise) {
		return promise.then(function() {
			return backupRepo(url, destinationDir);
		});
	} else {
		return backupRepo(url, destinationDir);
	}
}

var github = require("../lib/github");
function publicUserRepos(username, destinationDir) {
	return github.getPublicUserRepos(username).then(function(repos) {
		var promise;
		for (var i = 0; i < repos.length; i++) {
			var url = repos[i].clone_url; // jshint ignore:line
			promise = backupRepoSerialized(url, destinationDir, promise);
		}
		return promise;
	});
}

module.exports = {
	publicUserRepos: publicUserRepos
};
