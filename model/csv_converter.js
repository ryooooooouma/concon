process.chdir(__dirname);
var os = require('os');
var url = require('url');
var child_process = require('child_process');
var async = require('async');
var fs = require("fs");
var express = require('express');
var moment = require("moment");
var sprintf = require('sprintf-js').sprintf;
var uuidv1 = require('uuid/v1');
var csvSync = require('csvsync');

var target = 'testdata';
fs.readdir(target, function(err, files) {
	if (err)
		throw err;
	for (var i = 0; i < files.length; i++) {
		if (files[i].substr(-4, 4) == ".csv") {
			console.log(files[i]);
			var data = fs.readFileSync(target + "/" + files[i], 'utf8');
			var ret = csvSync.parse(data, {
				returnObject : true
			});
			var output_file = target + "/"
				+ files[i].substr(0, files[i].length - 4) + ".json";
			fs
				.writeFile(output_file, JSON.stringify(ret), 'utf8', function(
					err) {
					if (err) {
						return console.log(err);
					}
				});
			// console.log(ret);
		}
	}
});