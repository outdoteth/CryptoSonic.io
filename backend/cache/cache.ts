import redis = require("redis");

export const cacheDb = redis.createClient();

export function start() {
	cacheDb.on("error", function(error) {
		throw new Error(error);
	});
}


