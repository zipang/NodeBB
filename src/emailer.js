'use strict';

var async = require('async');
var winston = require('winston');
var nconf = require('nconf');
var templates = require('templates.js');
var nodemailer = require('nodemailer');
var wellKnownServices = require('nodemailer/lib/well-known/services');
var htmlToText = require('html-to-text');
var url = require('url');

var User = require('./user');
var Plugins = require('./plugins');
var meta = require('./meta');
var translator = require('./translator');

var transports = {
	sendmail: nodemailer.createTransport({
		sendmail: true,
		newline: 'unix',
	}),
	smtp: undefined,
	// gmail: undefined,
};

var app;
var fallbackTransport;

var Emailer = module.exports;

Emailer.listServices = function (callback) {
	var services = Object.keys(wellKnownServices);
	setImmediate(callback, null, services);
};

Emailer.registerApp = function (expressApp) {
	app = expressApp;

	// Enable SMTP transport if enabled in ACP
	// this covers the Gmail transport with `service = "Gmail"`
	if (parseInt(meta.config['email:smtpTransport:enabled'], 10) === 1) {
		var smtpOptions = {
			auth: {
				user: meta.config['email:GmailTransport:user'],
				pass: meta.config['email:GmailTransport:pass'],
			},
		};

		if (meta.config['email:smtpTransport:service'] === 'nodebb-custom-smtp') {
			smtpOptions.port = meta.config['email:smtpTransport:port'];
			smtpOptions.host = meta.config['email:smtpTransport:host'];
			smtpOptions.secure = true;
		} else {
			smtpOptions.service = meta.config['email:smtpTransport:service'];
		}

		transports.smtp = nodemailer.createTransport(smtpOptions);
		fallbackTransport = transports.smtp;
	} else {
		fallbackTransport = transports.sendmail;
	}

	return Emailer;
};

Emailer.send = function (template, uid, params, callback) {
	callback = callback || function () {};
	if (!app) {
		winston.warn('[emailer] App not ready!');
		return callback();
	}

	async.waterfall([
		function (next) {
			async.parallel({
				email: async.apply(User.getUserField, uid, 'email'),
				settings: async.apply(User.getSettings, uid),
			}, next);
		},
		function (results, next) {
			if (!results.email) {
				winston.warn('uid : ' + uid + ' has no email, not sending.');
				return next();
			}
			params.uid = uid;
			Emailer.sendToEmail(template, results.email, results.settings.userLang, params, next);
		},
	], callback);
};

Emailer.sendToEmail = function (template, email, language, params, callback) {
	callback = callback || function () {};

	var lang = language || meta.config.defaultLang || 'en-GB';

	async.waterfall([
		function (next) {
			async.parallel({
				html: function (next) {
					renderAndTranslate('emails/' + template, params, lang, next);
				},
				subject: function (next) {
					translator.translate(params.subject, lang, function (translated) {
						next(null, translated);
					});
				},
			}, next);
		},
		function (results, next) {
			var data = {
				_raw: params,
				to: email,
				from: meta.config['email:from'] || 'no-reply@' + getHostname(),
				from_name: meta.config['email:from_name'] || 'NodeBB',
				subject: results.subject,
				html: results.html,
				plaintext: htmlToText.fromString(results.html, {
					ignoreImage: true,
				}),
				template: template,
				uid: params.uid,
				pid: params.pid,
				fromUid: params.fromUid,
			};
			Plugins.fireHook('filter:email.modify', data, next);
		},
		function (data, next) {
			if (Plugins.hasListeners('filter:email.send')) {
				Plugins.fireHook('filter:email.send', data, next);
			} else {
				Emailer.sendViaFallback(data, next);
			}
		},
	], function (err) {
		if (err && err.code === 'ENOENT') {
			callback(new Error('[[error:sendmail-not-found]]'));
		} else {
			callback(err);
		}
	});
};

Emailer.sendViaFallback = function (data, callback) {
	// Some minor alterations to the data to conform to nodemailer standard
	data.text = data.plaintext;
	delete data.plaintext;

	// NodeMailer uses a combined "from"
	data.from = data.from_name + '<' + data.from + '>';
	delete data.from_name;

	winston.verbose('[emailer] Sending email to uid ' + data.uid + ' (' + data.to + ')');
	fallbackTransport.sendMail(data, function (err) {
		if (err) {
			winston.error(err);
		}
		callback();
	});
};

function render(tpl, params, next) {
	if (meta.config['email:custom:' + tpl.replace('emails/', '')]) {
		var text = templates.parse(meta.config['email:custom:' + tpl.replace('emails/', '')], params);
		next(null, text);
	} else {
		app.render(tpl, params, next);
	}
}

function renderAndTranslate(tpl, params, lang, callback) {
	render(tpl, params, function (err, html) {
		translator.translate(html, lang, function (translated) {
			callback(err, translated);
		});
	});
}

function getHostname() {
	var configUrl = nconf.get('url');
	var parsed = url.parse(configUrl);

	return parsed.hostname;
}
