import redis = require("redis");

export const cacheDb = redis.createClient();

// Requires callbacks
// TODO: Write a wrapper around these so we can use promises instead
export function start() {
	cacheDb.on("error", function(error) {
		throw new Error(error);
	});
}

