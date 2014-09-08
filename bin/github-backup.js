#!/usr/bin/env node
"use strict";

var backup = require("../lib/backup");

function main(argv) {
	var args = argv.slice(2);
	if (args.length !== 2) {
		console.error("Usage: github-backup username path");
		process.exit(-1);
	}
	backup.publicUserRepos(args[0], args[1]).catch(function(err) {
		console.error("Unhandled error:", err);
	}).done();
}

main(process.argv);
