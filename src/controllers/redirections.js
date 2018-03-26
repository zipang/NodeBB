var nconf = require("nconf"),
	winston = require("winston"),
	fs = require("fs-extra"),
	wtm = require("gray-matter");

class PropertyFileWatcher {

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
			this.data = wtm.read(this._path).data;
			winston.info(`LOADED ${this.data} redirections from ${this._path}`);
		} catch (err) {
			winston.error("ERROR parsing YAML values : " + this._path);
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
		watcher = new PropertyFileWatcher(
			nconf.get("redirections_file"),
			{
				transform: function(data) {
					return data.redirections.map(function(redir) {
						return {
							origin: new RegExp("^" + redir.origin + "$", "i"),
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

module.exports = function (req, res, next) {

	// Lazily load the redirection file
	if (!watcher) initWatcher();

	var redirectionRules = watcher.data;

	// Find the first redirection rule that would match our requested path
	var match = redirectionRules.find(rule => rule.origin.test(req.path))

	if (match) {
		winston.info(`Redirecting ${req.path} to ${match.path}`);
		return res.redirect(301, nconf.get("relative_path") + encodeURI(match.path));
	} else {
		return next();
	}
}