var net = require('net');
var async = require('async');

var TrackerSimulator = require('./tracker-simulator');
var MESSAGE_CMD_T = "#861785001515349,CMD-T,V,DATE:120903,TIME:160649,LAT:59.9326566N,LOT:010.7875033E,Speed:005.5,X-X-X-X-49-5,000,24202-0ED9-D93B#";
var MESSAGE_CMD_X = "#861785001515349,CMD-X#";
var MESSAGE_ALM_A = "#861785001515349,ALM-A,V,DATE:120903,TIME:160649,LAT:59.9326566N,LOT:010.7875033E,Speed:005.5,X-X-X-X-82-10,000,24202-0324-0E26#";


function getParameters() {
	
	var args = process.argv.slice(2);
	if (args.length < 2) {
		throw "usage <hostname> <port>";
	}
	
	var params = new Object();
	
	params.hostname = args[0];
	params.port = args[1];
	return params;
}

var parameters = getParameters();

var openConnections = 0;
var totalConnections = 0;
var pendingConnections = 0;
var failedConnections = 0;

var connect = function(localAddress, callback) {
	console.log('connect');
	var connectOptions = new Object();
	connectOptions.port = parameters.port;
	connectOptions.host = parameters.hostname;
	connectOptions.localAddress = localAddress;

    var trackerSimulator = new TrackerSimulator();
    
    trackerSimulator.connect(connectOptions, function(err) {
        callback(err, trackerSimulator);
    });		 
};

var spawnConnections = function(localAddress) {
	var i = 0;
    
	var connectCallback = function(err, trackerSimulator) {
		if (err) {
		    pendingConnections--;
            failedConnections++;
		} else {
			openConnections++;
            pendingConnections--;
            async.forever(function(callback) {
                trackerSimulator.sendMessage([ MESSAGE_CMD_T, MESSAGE_CMD_X, MESSAGE_ALM_A ], 3000, 100, 100, callback);
            }, function() {
                openConnections--;
            });
		}
	};
	
	var doConnect = function() {
		if (i < 1) {
			connect(localAddress, connectCallback);
			pendingConnections++;
			i++;
		}
	};
	doConnect();
};
var showDebug = function() {
	var closedConnections = totalConnections - openConnections;
	console.log('open conneciton ' + openConnections + ' total connections '
			+ totalConnections + ' pending connections ' + pendingConnections + ' failed connections ' + failedConnections);
};

setInterval(showDebug, 1000);
spawnConnections();

