#!/usr/bin/env node
"use strict";

var backup = require("../lib/backup");
var ArgumentParser = require('argparse').ArgumentParser;
var pkg = require('../package.json');

function main(argv) {

	var parser = new ArgumentParser({
		version: pkg.version,
		addHelp: true,
		description: pkg.description
	});

	parser.addArgument("username", {
		help: "The github username to backup."
	});
	parser.addArgument("path", {
		help: "The path where to backup the repositories to."
	});

	parser.addArgument(['--include', '-i'], {
		defaultValue: 'user,org,starred',
		type: function(i) { return i.split(","); },
		help: "Choose which repositories to backup. You can "+
			"select user, org and stared, and any combination"+
			" separated by ,"
	});

	parser.addArgument(['--dry-run', '-n'], {
		action:"storeTrue",
		help:"If set, no action is actually performed."
	});

	var args = parser.parseArgs();

	backup.publicUserRepos(args).catch(function(err) {
		console.error("Unhandled error:", err);
	}).done();
}

main();
