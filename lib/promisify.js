"use strict";

var Promise = require("bluebird"); // jshint ignore:line

var http = require("http");
var https = require("https");
function httpsGet(options) {
	return new Promise(function(resolve, reject) {
		https.get(options, function(res) {
			if (res.statusCode >= 400) {
				readableStream(res).then(function(data) {
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

function readableStream(stream) {
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

var childProcess = require("child_process");
function exec(command, args, options) {
	return new Promise(function(resolve, reject) {
		options = options || {};
		options.stdio = ["ignore", process.stdout, process.stderr];
		childProcess.spawn(command, args, options).on("close", function(code) {
			if (code === 0) {
				resolve();
			} else {
				reject("Process exited with code " + code);
			}
		});
	});
}

module.exports = {
	httpsGet: httpsGet,
	readableStream: readableStream,
	exec: exec
};
