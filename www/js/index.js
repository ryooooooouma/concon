var server = "http://192.168.0.156:9001";

function loadFile(path, callback) {
	var req = new XMLHttpRequest();
	req.open("get", path, true);
	req.send(null);

	req.onload = function() {
		callback(req.responseText);
	}
}

function get_buys() {
	loadFile(server + "/api/get_buys", function(text) {
		var buys = JSON.parse(text);
		console.log(buys);
		for (var i = 0; i < buys.length; i++) {
			var buy = buys[i];
			var template = document.querySelector('#buy_template').innerHTML;
			for (key in buy) {
				template = template.replace("%" + key + "%", buy[key]);
			}
			$("#buys").append(template);
		}
	});
}

$(document).ready(function() {
	console.log("ready");
	get_buys();
});