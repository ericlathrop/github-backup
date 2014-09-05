"use strict";

var https = require("https");
var url = require("url");
var Promise = require("bluebird");

function httpsGet(options) {
	return new Promise(function(resolve, reject) {
		https.get(options, function(res) {
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
		"User-Agent": "github-backup"
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

function backupRepo(repo) {
	console.log(repo.clone_url);
}

function getOrgRepos(org) {
	return get("/orgs/" + org.login + "/repos");
}

getPublicUserRepos("ericlathrop").each(backupRepo);
