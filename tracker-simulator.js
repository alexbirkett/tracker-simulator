var net = require('net');
var async = require('async');

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
function buildSliceArray(message) {
	var slices = [];
	for(var i = 0;true;i++) {
		var slice = sliceString(message, SLICE_LENGTH, i);
		slices.push(slice);
		if (slice.length != SLICE_LENGTH) {
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

function createEvent(name) {
	event = new Object();
	event.name = name;
	return event;
}

module.exports = function(messages, pauseBetweenMessages, pauseBetweenSlices, connectOptions, callback) {	

	var client = net.createConnection(connectOptions);
	
	var onConnect = function() {
		callback(createEvent("connected"));
		var sendNextMessage = function(message, sendMessageCallback) {
			
			sendMessage(message, client, pauseBetweenSlices, function() {
				setTimeout(function() {
					sendMessageCallback();
				}, pauseBetweenMessages);
			});
		};

		var onFinished = function() {
			sendMessages();
		};
		
		var sendMessages = function() {
			async.forEachSeries(messages, sendNextMessage, onFinished);
		};
	
		sendMessages();

	};
	

	client.addListener("connect", onConnect);
	
	client.addListener("error", function(err) {
		var event = createEvent("error");
		event.err = err;
		callback(err);
	});

};
	
