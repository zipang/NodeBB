var nconf   = require("nconf"),
	winston = require("winston"),
	{ URL } = require("url"),
	fs      = require("fs-extra"),
	matter  = require("gray-matter");

/**
 * A Watcher watches a file for modifications,
 * then reload and parse its front-matter content to expose it
 */
class Watcher {

	constructor(path, options) {
		this._path = path;
		this._options = options;

		this._watcher = fs.watch(path, event => {
			this.loadFileData();
		});

		this.loadFileData();
	}

	loadFileData() {

		try {
			this.data = matter.read(this._path).data;
			winston.info(`LOADED ${this.data.length} redirections rules from ${this._path}`);

		} catch (err) {
			this.data = [];
			winston.error("ERROR parsing when Front Matter values : " + this._path);
			winston.error(err);
		}

		if (this._options.transform) {
			this.data = this._options.transform(this.data);
		}
	}
}

// Redirection
var watcher = null; // not loaded

function initWatcher() {
	try {
		watcher = new Watcher(
			nconf.get("redirections_file"),
			{
				transform: function(data) {
					return data.redirections.map(function(redir) {
						return {
							origin: new RegExp("^" + redir.origin, "i"),
							site: nconf.get("domains")[redir.destination],
							path: redir.path || ""
						}
					});
				}
			}
		);
	} catch (err) {
		winston.error("Error while trying to load the redirection file : " + nconf.get("redirections_file"));
		winston.error(err);
		watcher = {
			data: []
		}
	}
}

/**
 * Express Redirections Middleware
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
module.exports = function (req, res, next) {

	// Lazily load the watcher on redirections
	if (!watcher) initWatcher();

	winston.debug(`I don't know what to do with that : ${req.path} - from ${req.headers.referer} - ${Object.keys(req.headers)}`);

	var redirectURL, redirectionRules = watcher.data;

	// Find the first redirection rule that would match our requested path
	var match = redirectionRules.find(rule => rule.origin.test(req.path))

	if (match) {
		redirectURL = new URL(req.path.replace(match.origin, match.path), match.site);
		winston.info(`Redirecting ${req.path} to ${redirectURL}`);
		return res.redirect(301, redirectURL);
	} else {
		return next();
	}
}