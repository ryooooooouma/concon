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
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
	host : 'sv2344.xserver.jp',
	port : 465,
	auth : {
		user : 'contact@concon.link',
		pass : 'gh-09utyj324'
	}
});
function sendMail(to, subject, text) {
	transporter.sendMail({
		from : 'contact@concon.link',
		to : to,
		subject : subject,
		text : text
	}, function(error, info) {
		console.log(info);
	});
	return;
}

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
var users = [];
var logins = [];
var buys = [];

var options = JSON.parse(fs.readFileSync('config.json', 'utf8'));

function get_user(mail_address) {
	if (!mail_address) {
		return false;
	}
	for (var i = 0; i < logins.length; i++) {
		if (users[i].mail_address == mail_address) {
			return users[i];
		}
	}
	return false;
}
function get_login(login_key) {
	if (!login_key) {
		return false;
	}
	for (var i = 0; i < logins.length; i++) {
		if (logins[i].key == login_key) {
			return logins[i];
		}
	}
	return false;
}
function get_buy(buy_key) {
	if (!buy_key) {
		return false;
	}
	for (var i = 0; i < buys.length; i++) {
		if (buys[i].key == buy_key) {
			return buys[i];
		}
	}
	return false;
}

async
	.waterfall([
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
		function(callback) {// init tables
			users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
			logins = JSON.parse(fs.readFileSync('data/logins.json', 'utf8'));
			buys = JSON.parse(fs.readFileSync('data/buys.json', 'utf8'));
			callback(null);
		},
		function(callback) {// start up websocket server
			console.log("api server starting up");
			var app = require('express')();
			http = require('http').Server(app);
			app
				.get('/api/add_user', function(req, res) {
					console.log("add_user");
					var params = url.parse(req.url, true).query.params || {};
					console.log(params);
					var user = {
						id : uuidv1(),
						mail_address : info.mail_address,
						password : info.password,
						type : info.type,
					};
					if (!user.mail_address) {
						res.end("ERROR:invalid mail address");
						return;
					}
					users.push(user);
					fs
						.writeFile('data/users.json', JSON.stringify(users), 'utf8', function(
							err) {
							if (err) {
								return console.log(err);
							}

							res.end("OK");
						});
				});
			app
				.get('/api/login', function(req, res) {
					console.log("login");
					var params = url.parse(req.url, true).query.params || {};
					var user = get_user(params.mail_address);
					if (!user) {
						res.end("ERROR:invalid mail address");
						return;
					}
					if (user.password != params.password) {
						res.end("ERROR:invalid password");
						return;
					}
					var login = {
						key : uuidv1(),
						user_id : users[i].id
					};
					logins.push(login);
					fs
						.writeFile('data/logins.json', JSON.stringify(logins), 'utf8', function(
							err) {
							if (err) {
								return console.log(err);
							}
							var ret = {
								status : "OK",
								login_key : login_key
							}
							res.end(JSON.stringify(ret));
							return;
						});
				});
			app
				.get('/api/buy_request', function(req, res) {
					console.log("buy_request");
					var params = url.parse(req.url, true).query.params || {};
					var login = get_login(params.login_key);
					if (!login) {
						res
							.end(JSON
								.stringify('{status:"ERROR", error:"invalid login_key"}'));
						return;
					}
					var buy = {
						key : uuidv1(),
						buyer_id : login.user_id,
						summary : params.summary,
						detail : params.detail,
						status : "active"
					};
					buys.push(buy);
					fs
						.writeFile('data/buys.json', JSON.stringify(buys), 'utf8', function(
							err) {
							if (err) {
								return console.log(err);
							}
							var ret = {
								status : "OK"
							}
							res.end(JSON.stringify(ret));
							return;
						});
				});
			app
				.get('/api/sell_request', function(req, res) {
					console.log("sell_request");
					var params = url.parse(req.url, true).query.params || {};
					var login = get_login(params.login_key);
					if (!login) {
						res
							.end(JSON
								.stringify('{status:"ERROR", error:"invalid login_key"}'));
						return;
					}
					var seller = get_user(login.user_id);
					var buy = get_buy(params.buy_key);
					if (!buy) {
						res
							.end(JSON
								.stringify('{status:"ERROR", error:"invalid buy_key"}'));
						return;
					}
					buy.seller_id = login.user_id;
					buy.status = "closed";
					var ret = {
						status : "OK"
					}
					var buyer = get_user(buy.buyer_id);
					sendMail(buyer.mail_address, "sell", "done");
					sendMail(seller.mail_address, "sell", "done");
					res.end(JSON.stringify(ret));
				});
			app.get('/api/get_users', function(req, res) {
				console.log("get_users");
				res.end(JSON.stringify(users));
			});
			app.get('/api/get_buys', function(req, res) {
				console.log("get_buys");
				res.end(JSON.stringify(buys));
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
