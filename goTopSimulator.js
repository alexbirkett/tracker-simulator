var net = require('net');
var async = require('async');

var trackerSimulator = require('./TrackerSimulator');
var MESSAGE_CMD_T = "#861785001515349,CMD-T,V,DATE:120903,TIME:160649,LAT:59.9326566N,LOT:010.7875033E,Speed:005.5,X-X-X-X-49-5,000,24202-0ED9-D93B#";
var MESSAGE_CMD_X = "#861785001515349,CMD-X#";
var MESSAGE_ALM_A = "#861785001515349,ALM-A,V,DATE:120903,TIME:160649,LAT:59.9326566N,LOT:010.7875033E,Speed:005.5,X-X-X-X-82-10,000,24202-0324-0E26#";

var connect = function(callback) {
	trackerSimulator([ MESSAGE_CMD_T, MESSAGE_CMD_X, MESSAGE_ALM_A ], 1000, 100,
			callback);
};

var openConnections = 0;
var totalConnections = 0;

var spawnConnections = function() {

	console.log('hello');
	
	var i = 0;
	var doSpawn = function() {
		openConnections++;
		totalConnections++;
		connect(function() {
			openConnections--;
		});
		i++;
		if (i < 30000) {
		setTimeout(doSpawn, 5);
		}
	}
	process.nextTick(doSpawn);

};
var showDebug = function() {
	var closedConnections = totalConnections - openConnections;
	console.log('open conneciton ' + openConnections + ' total connections '
			+ totalConnections + ' closed connections ' + closedConnections);
};

setInterval(showDebug, 1000);
spawnConnections();
