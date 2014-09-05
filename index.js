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

get("/users/ericlathrop/repos").then(function(repos) {
	repos.forEach(backupRepo);
}, function(err) {
	console.error("err", err);
}).done();

function backupRepo(repo) {
	console.log(repo["clone_url"]);
}

get("/users/ericlathrop/orgs").then(function(orgs) {
	orgs.forEach(backupOrg);
}).done();

function backupOrg(org) {
	get("/orgs/" + org.login + "/repos").then(function(repos) {
		repos.forEach(backupRepo);
	});
}
