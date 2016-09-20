"use strict";

var Promise = require("bluebird"); // jshint ignore:line

/*
 * A GitHub Access Token for higher API rate limits.
 * You can generate on on https://github.com/settings/applications#personal-access-tokens
 */
var accessToken = process.env.GITHUB_ACCESS_TOKEN;

var promisify = require("./promisify");

var url = require("url");
function get(path) {
	var options = url.parse("https://api.github.com" + path);
	options.headers = {
		"User-Agent": "github-backup",
		"Accept": "application/vnd.github.v3+json"
	};
	if (accessToken) {
		options.headers["Authorization"] = "token " + accessToken;
	}

	return promisify.httpsGet(options).then(promisify.readableStream).then(JSON.parse);
}

function getPublicUserRepos(user, include) {
	var pr = [];

	if(include.indexOf("user") !== -1) {
		pr.push(get("/users/" + user + "/repos")); 
	}

	if(include.indexOf("org") !== -1) {
		pr.push(get("/users/" + user + "/orgs").map(getOrgRepos).all()); 
	}

	if(include.indexOf("starred") !== -1) {
		pr.push(get("/users/" + user + "/starred")); 
	}

	return Promise.all(pr).then(function(res) {
		return [].concat.apply([], res);
	});
}

function getOrgRepos(org) {
	return get("/orgs/" + org.login + "/repos");
}

module.exports = {
	getPublicUserRepos: getPublicUserRepos
};
