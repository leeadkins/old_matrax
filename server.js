//setup Dependencies
require(__dirname + "/lib/setup").ext( __dirname + "/lib").ext( __dirname + "/lib/express/support");
var connect = require('connect')
		, fs = require('fs')
		, querystring = require('querystring')
		, Buffer = require('buffer').Buffer
    , express = require('express')
    , sys = require('sys')
    , io = require('Socket.IO-node')
    , port = 8081;
var pixel;
//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.use(connect.bodyDecoder());
		
    server.use(server.router);
		
    server.use(connect.staticProvider(__dirname + '/static'));
});

//Setup the Tracking Pixel
pixel = new Buffer(43);
pixel.write(fs.readFileSync(__dirname + "/images/tracking.gif", 'binary'), 'binary', 0);

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.ejs', { locals: { 
                  header: '#Header#'
                 ,footer: '#Footer#'
                 ,title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.ejs', { locals: { 
                  header: '#Header#'
                 ,footer: '#Footer#'
                 ,title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port);

//Setup Socket.IO
var io = io.listen(server);
io.on('connection', function(client){
	console.log('Client Connected');
	client.on('message', function(message){
		client.broadcast(message);
		client.send(message);
	});
	client.on('disconnect', function(){
		console.log('Client Disconnected.');
	});
});


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/word/', function(req,res){
	//Broadcast the new data
	io.broadcast("This is a message");
	res.send("Done");
});

server.get('/dashboard/', function(req,res){
	res.render('dashboard.ejs', {layout: false });
});

server.get('/', function(req,res){
  res.render('index.ejs', {
    locals : { 
              header: '#Header#'
             ,footer: '#Footer#'
             ,title : 'Page Title'
             ,description: 'Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
            }
  });
});

server.get('/track', function(req, res){
	//Do work, son
	var trackdata = splitQuery(req.url.split('?')[1]);
	console.log("Visit: " + trackdata);
	io.broadcast(trackdata);
	//Respond quickly so the client can get on with its business
	res.writeHead(200, { 'Content-Type': 'image/gif',
                       'Content-Disposition': 'inline',
                       'Content-Length': '43' });
  res.end(pixel);

});

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

function splitQuery(query) {
  var queryString = {};
  (query || "").replace(
    new RegExp("([^?=&]+)(=([^&]*))?", "g"),
    function($0, $1, $2, $3) { queryString[$1] = querystring.unescape($3.replace(/\+/g, ' ')); }
  );

  return queryString;
}

console.log('Listening on http://0.0.0.0:' + port );
