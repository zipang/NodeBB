'use strict';


var fork = require('child_process').fork;
var path = require('path');

exports.hash = function (rounds, password, callback) {
	forkChild({ type: 'hash', rounds: rounds, password: password }, callback);
};

exports.compare = function (password, hash, callback) {
	if (!hash || !password) {
		return setImmediate(callback, null, false);
	}
	forkChild({ type: 'compare', password: password, hash: hash }, callback);
};

function forkChild(message, callback) {
	var forkProcessParams = {
		execArgv: [],
	};

	var inspectArg = process.execArgv.find(arg => arg.startsWith('--inspect'));
	if (global.v8debug || inspectArg) {
		var num = inspectArg.split('=')[1];
		num = num && parseInt(num, 10) + 1;
		forkProcessParams = { execArgv: ['--inspect=' + num, '--nolazy'] };
	}

	var child = fork(path.join(__dirname, 'bcrypt'), [], forkProcessParams);

	child.on('message', function (msg) {
		if (msg.err) {
			return callback(new Error(msg.err));
		}

		callback(null, msg.result);
	});

	child.send(message);
}
