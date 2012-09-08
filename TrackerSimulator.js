var net = require('net');
var async = require('async');

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

function sliceString(string, sliceLength, index) {
	
	var beginPos = index*sliceLength;
	var endPos = beginPos + sliceLength;
	var slice;
	if (beginPos < string.length) {
		if (endPos < string.length) {
			slice = string.slice(beginPos, beginPos + sliceLength);
		} else {
			slice = string.slice(beginPos);
		}
	} else {
		throw "out of bounds";
	}
	return slice;
}


function sendMessage(message, client, pauseBetweenSlices, callback) {
	var sliceIndex = 0;
	var sliceLength = 40;
	var sendNextSlice = function() {
		var slice = sliceString(message, sliceLength, sliceIndex);
		sliceIndex++;
		client.write(slice);
		if (slice.length == sliceLength) {
			setTimeout(sendNextSlice, pauseBetweenSlices);
		} else {
			callback();
		}
	};
	sendNextSlice();
}

function connectSocket(onConnect) {
	var params = getParameters();
	
	var client = net.createConnection(params.port, params.hostname);
	client.addListener("connect", function() {
		onConnect(client);
	});
	
	client.addListener("error", function(err) {
		console.log(err);
	});
}

module.exports = function(messages, pauseBetweenMessages, pauseBetweenSlices, callback) {	
	
	var onConnect = function(client) {
		
		var sendNextMessage = function(message, sendMessageCallback) {
			
			sendMessage(message, client, pauseBetweenSlices, function() {
				setTimeout(function() {
					sendMessageCallback();
				}, pauseBetweenMessages);
			});
		};

		var onFinished = function() {
			client.destroy();
			callback();
		};
		
		async.forEachSeries(messages, sendNextMessage, onFinished);
		
	};
	
	connectSocket(onConnect);
};
	
