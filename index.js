var http = require('http');
var BTCE = require('./btc-e.js');
var mongo = require('mongodb');
var url = require('url');
var mongoClient = require('mongodb').MongoClient;
var async = require('async');

//var MONGOHQ_URL="mongodb://nodejitsu:de9720a1df0ff9ea226b0d60eaa61459@linus.mongohq.com:10032/nodejitsudb5735702882";
var MONGOHQ_URL="mongodb://localhost:27017/d3";

mongoClient.connect(MONGOHQ_URL, function(error, db) {
	"use strict";

		(function(){
		var btcePublic = new BTCE();

		db.collection('trades', function(err,collection){
		collection.ensureIndex({'tid':1}, function(){});
		collection.ensureIndex({'date':1}, function(){})
		});


		var dbTrades = function() {btcePublic.trades("btc_usd", function(err, data) {
				if (!err) {
					try{
                        data.forEach(function(a){
                            db.collection('trades', function(err,collection){
                                if (!err) {
                                    collection.findOne({'tid':a.tid}, function(err, result) {
                                        if (!err) {
                                            if (!result) {
                                                collection.insert(a, function(){});
                                            } else {
                                                //console.log('SI HAY, tid:' + a.tid);
                                            }
                                        }
                                    });
                                }
                                else {
                                	console.log(err);		
                                }
                            });
                        });
					}
					catch (err) {

						}
				}

				});
        };
		
		var dbTicker = function(callback) {btcePublic.ticker("btc_usd", function(err, data) {
				if (!err) {
					try{
						callback(err,data);
					}
					catch (err) {

						}
				}

				});};

		var dbDepth = function(callback) {btcePublic.depth("btc_usd", function(err, data) {
				if (!err) {
					try{
						callback(err,data);
					}
					catch (err) {

						}
				}
				});};

		var dbDepthTime = function(err,result) {
				var vectorDepth = [];
				var elementDepth ={};

				if (!err) {
					try{
						var aTime = result[0].ticker.server_time;
						var depth = result[1];
						var asks =depth.asks;
						var bids =depth.bids;
						for (var i=0;i<asks.length;i++)
						{	
							elementDepth ={};
							elementDepth.timeServer = aTime;
							elementDepth.price = asks[i][0];
							elementDepth.amount = asks[i][1];
							elementDepth.types = "ask";
							vectorDepth.push(elementDepth);

						}

						for (var i=0;i<bids.length;i++)
						{
							elementDepth ={};
							elementDepth.timeServer = aTime;
							elementDepth.price = bids[i][0];
							elementDepth.amount = bids[i][1];
							elementDepth.types = "bid";
							vectorDepth.push(elementDepth);
						}

						vectorDepth.forEach(function(a){
										db.collection('depth', function(err,collection){
											if (!err) { 
												collection.insert(a, function(){});
												}
										});
									 });
						
					}
					catch (err) {
							console.log(err);
						}
				}
		};

		setInterval(function () {
			async.parallel([
			    dbTicker,
			    dbDepth],
				dbDepthTime);
			dbTrades();
		},5000)})();
});