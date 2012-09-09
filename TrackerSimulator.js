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

var SLICE_LENGTH = 40;
function buildSliceArray(messsage) {
	var slices = [];
	for(var i = 0; i++;) {
		var slice = sliceString(message, SLICE_LENGTH, i);
		if (slice.length != SLICE_LENGTH) {
			slices.push(slice);
			break;
		}
	}
	return slices;
}

function sendMessage(message, client, pauseBetweenSlices, callback) {
	var slices = buildSliceArray(message);
	
	var sendNextSlice = function(slice, sendSliceCallback) {
		client.write(slice);
		setTimeout(function() {
			sendSliceCallback();
		}, pauseBetweenSlices);
		
	};

	async.forEachSeries(slices, sendNextSlice, function() {
		callback();
	});
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
			sendMessages();
			//client.destroy();
			//callback();
		};
		
		var sendMessages = function() {
			async.forEachSeries(messages, sendNextMessage, onFinished);
		}
	
		sendMessages();

	};
	
	connectSocket(onConnect);
};
	
