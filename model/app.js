process.chdir(__dirname);
var os = require('os');
var disk = require('diskusage');
var child_process = require('child_process');
var async = require('async');
var fs = require("fs");
var express = require('express');
var moment = require("moment");
var sprintf = require('sprintf-js').sprintf;
var uuidv1 = require('uuid/v1');

var SERVER_DOMAIN = "";

function watchFile(filepath, oncreate, ondelete) {
	var fs = require('fs'), path = require('path'), filedir = path
		.dirname(filepath), filename = path.basename(filepath);
	fs.watch(filedir, function(event, who) {
		if (event === 'rename' && who === filename) {
			if (fs.existsSync(filepath)) {
				if (oncreate)
					oncreate();
			} else {
				if (ondelete)
					ondelete();
			}
		}
	});
}
function removeArray(array, value) {
	for (var i = array.length - 1; i >= 0; i--) {
		if (array[i] === value) {
			array.splice(i, 1);
		}
	}
}
function clone(src) {
	var dst = {}
	for ( var k in src) {
		dst[k] = src[k];
	}
	return dst;
}

var http = null;

var options = JSON.parse(fs.readFileSync('config.json', 'utf8'));

async.waterfall([
	function(callback) {// exit sequence
		process.on('SIGINT', function() {
			console.log("exit process done");
			process.exit();
		});
		process.on('SIGUSR2', function() {
			if (agent.server) {
				agent.stop();
			} else {
				agent.start({
					port : 9999,
					bind_to : '192.168.3.103',
					ipc_port : 3333,
					verbose : true
				});
			}
		});
		callback(null);
	},
	function(callback) {// start up websocket server
		console.log("websocket server starting up");
		var app = require('express')();
		http = require('http').Server(app);
		app.get('/api/add_buyer', function(req, res) {
		});
		app.get('/api/add_seller', function(req, res) {
			var url = req.url.split("?")[0];
			var query = req.url.split("?")[1];
			var filepath = 'userdata/' + url.split("/")[2];
		});
		app.use(express.static('www'));// this need be set
		http.listen(9001, function() {
			console.log('listening on *:9001');
		});
		callback(null);
	},
	function(callback) {
		// load plugin
		if (options["plugin_paths"]) {
			for ( var k in options["plugin_paths"]) {
				var plugin_path = options["plugin_paths"][k];
				console.log("loading... " + plugin_path);
				var plugin = require("./" + plugin_path)
					.create_plugin(plugin_host);
				plugins.push(plugin);
			}
		}
		callback(null);
	}], function(err, result) {
});
