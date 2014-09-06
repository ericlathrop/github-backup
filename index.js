"use strict";

var http = require("http");
var https = require("https");
var url = require("url");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var path = require("path");
var exec = Promise.promisify(require("child_process").exec);

var destinationDir = "repos";

function httpsGet(options) {
	return new Promise(function(resolve, reject) {
		https.get(options, function(res) {
			if (res.statusCode >= 400) {
				promisifyReadableStream(res).then(function(data) {
					reject(res.statusCode + " " + http.STATUS_CODES[res.statusCode] + "\n" + data);
				}, function(err) {
					reject(err);
				});
				return;
			}
			resolve(res);
		}).on("error", function(err) {
			reject(err);
		});
	});
}
function promisifyReadableStream(stream) {
	return new Promise(function(resolve, reject) {
		var data = "";
		stream.on("data", function(d) {
			data += d;
		}).on("end", function() {
			resolve(data);
		}).on("error", function(err) {
			reject(err);
		});
	});
}

function get(path) {
	var options = url.parse("https://api.github.com" + path);
	options.headers = {
		"User-Agent": "github-backup",
		"Accept": "application/vnd.github.v3+json"
	};

	return httpsGet(options).then(promisifyReadableStream).then(JSON.parse);
}

function getPublicUserRepos(user) {
	var userRepos = get("/users/" + user + "/repos").all();
	var orgRepos = get("/users/" + user + "/orgs").map(getOrgRepos).all();
	return Promise.join(userRepos, orgRepos, function(userRepos, orgRepos) {
		return userRepos.concat.apply(userRepos, orgRepos);
	});
}

function getOrgRepos(org) {
	return get("/orgs/" + org.login + "/repos");
}

function backupRepo(repo) {
	var url = repo.clone_url;
	var re = new RegExp("https://github\.com/([^/]+)/([^/]+)");
	var matches = url.match(re);
	var user = matches[1];
	var repoName = matches[2];
	var repoPath = path.join(destinationPath, user, repoName);
	// console.log(url, user, repoName);

	return fs.statAsync(user).error(function() {
		return fs.mkdirAsync(user);
	}).then(function() {
		return fs.statAsync(repoPath);
	}).then(function() {
		console.log("updating", url);
		return exec("git remote update", { cwd: repoPath });
	}, function(err) {
		console.log("cloning", url);
		return exec("git clone --mirror " + url + " " + repoPath);
	});
}

getPublicUserRepos("ericlathrop").then(function(repos) {
	var promise;
	for (var i = 0; i < repos.length; i++) {
		var repo = repos[i];
		if (promise) {
			promise = promise.then(function(stdout) {
				console.log("finished");
				console.log(stdout);
				return backupRepo(repo);
			}, function(err) {
				console.log("backupRepo err", err);
			});
		} else {
			promise = backupRepo(repo);
		}
	}
	return promise;
}, function(err) {
	console.error("Unhandled error:", err);
}).done();
