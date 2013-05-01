var TrackerSimulator = require('../tracker-simulator');
var assert = require('assert');
var vows = require('vows');
var async = require('async');
var net = require('net');
require('smarter-buffer');
var forEach = require('async-foreach').forEach;


process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err.stack);
});

var createServer = function(port, dataToSend, callback) {	
	var numberOfCallsToData = 0;
	var numberOfCallsToEnd = 0;
	var buffer;
	
	var server = net.createServer(function(client) {//'connection' listener
		
		if (dataToSend) {
	       client.write(dataToSend);    
		}
		
		client.on('end', function(data) {
			closeServer();
			numberOfCallsToEnd++;
			buffer = Buffer.smarterConcat([buffer, data]);
		});
	

		client.on('data', function(data) {
			numberOfCallsToData++;
			buffer = Buffer.smarterConcat([buffer, data]);
		});
		
		client.on('error', function() {
           console.log('socket error'); 
        });
	
	});
	
	server.listen(port, function() { //'listening' listener
 	});
	
	server.on('error', function() {
           console.log('server error'); 
    });
    
	var closeServer = function() {
	   server.close(function(err) {
			callback(err, buffer, numberOfCallsToData, numberOfCallsToEnd);  
		});
	}
}

var nextPort = 3141;
var getNextPort = function() {
	return nextPort++;
}

vows.describe('tracker-simulator').addBatch({
    'test pause between messages': {
        topic: function() {
        	var trackerSimulator = new TrackerSimulator();
        	var port = getNextPort();
        	createServer(port, undefined, this.callback);
        	
        	async.series([
			    function(callback)	{
			        
			   		trackerSimulator.connect({host: 'localhost', port: port}, callback);
			   	},
			    function(callback) {
			        
			    	var messages = ['hello', 'world'];
			    	//messages, pauseBetweenMessages, pauseBetweenSlices, sliceLength,
			    	trackerSimulator.sendMessage(messages, 1000, 2, 50, callback);
			    }
			],function(err) {
	       		trackerSimulator.destroy();
			});
        },
        'should not return error': function (err, buffer, numberOfCallsToData, numberOfCallsToEnd) {
            assert.isNull(err);
        },
        'should have called data twice': function (err, buffer, numberOfCallsToData, numberOfCallsToEnd) {
            assert.equal(numberOfCallsToData, 2);
        },
        'buffer should be helloworld': function (err, buffer, numberOfCallsToData, numberOfCallsToEnd) {
            assert.equal("helloworld", buffer);
        }
    },
    'test pause between slices': {
        topic: function() {
            var trackerSimulator = new TrackerSimulator();
            var port = getNextPort();
            createServer(port, undefined, this.callback);
            
            async.series([
                function(callback)  {
                    
                    trackerSimulator.connect({host: 'localhost', port: port}, callback);
                },
                function(callback) {
                    
                    var messages = ['12'];
                    //messages, pauseBetweenMessages, pauseBetweenSlices, sliceLength,
                    trackerSimulator.sendMessage(messages, 0, 1000, 1, callback);
                }
            ],function(err) {
                trackerSimulator.destroy();
            });
        },
        'should not return error': function (err, buffer, numberOfCallsToData, numberOfCallsToEnd) {
            assert.isNull(err);
        },
        'should have called data twice': function (err, buffer, numberOfCallsToData, numberOfCallsToEnd) {
            assert.equal(numberOfCallsToData, 2);
        },
        'buffer should be helloworld': function (err, buffer, numberOfCallsToData, numberOfCallsToEnd) {
            assert.equal("12", buffer);
        }
    },
    'waits for data': {
        topic: function() {
            var trackerSimulator = new TrackerSimulator();
            var port = getNextPort();
            createServer(port, "0123456789", function() {console.log('server finished')});
            
            var topicCallback = this.callback;
            async.series([
                function(callback)  {
                    trackerSimulator.connect({host: 'localhost', port: port}, callback);
                },
                function(callback) {
                    var messages = ['hello', 'world'];
                    trackerSimulator.sendMessage(messages, 1000, 2, 1, callback);
                },
                function(callback) {
                    trackerSimulator.waitForData(10, callback);
                }
            ],function(err, data) {
                trackerSimulator.destroy();
                topicCallback(err, data);
            });
        },
        'should not return error': function (err, data) {
            assert.isNull(err);
        },
        'buffer should be hello world': function (err, data) {
            assert.equal(data[2], "0123456789");
        }
    },
    'waits for data when lenght is 0': {
        topic: function() {
            var trackerSimulator = new TrackerSimulator();
            var port = getNextPort();
            createServer(port, undefined, function() {console.log('server finished')});
            
            var topicCallback = this.callback;
            async.series([
                function(callback)  {
                    trackerSimulator.connect({host: 'localhost', port: port}, callback);
                },
                function(callback) {
                    var messages = ['hello', 'world'];
                    trackerSimulator.sendMessage(messages, 1000, 2, 1, callback);
                },
                function(callback) {
                    trackerSimulator.waitForData(0, callback);
                }
            ],function(err, data) {
                trackerSimulator.destroy();
                topicCallback(err, data);
            });
        },
        'should not return error': function (err, data) {
            console.log('finished second');
            assert.isNull(err);
        },
        'buffer should be hello world': function (err, data) {
            assert.isUndefined(data[2]);
        }
    }
}).export(module); // Export the Suite