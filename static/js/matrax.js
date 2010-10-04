//Some Environment items
var cols = 35;
var cubeSize = 20;
var canHeight = 400;
var canWidth = 700;

var speedHeight = 150;
var speedWidth = 960;

var speed = 50 / (1000/30); //10 pixels per second drop rate


var nps = 0;
var npsAccumulator = 0;
//End Environment Items
var socket;
var visits = [];
var types = [];

var canvas = document.getElementById("streamer");
var ctx = canvas.getContext("2d");

var chcanvas = document.getElementById("charter");
var chctx = chcanvas.getContext("2d");

function initializeSocket(){
	io.setPath('/client/');
	socket = new io.Socket(null, {
		port: 8081,
		transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
	});
	socket.connect();
	
	socket.on('message', function(data){
		npsAccumulator += 1;
		if(data.name == null) data.name = "Unknown";
		if(data.color == null)
		{
			data.color = "#FFFFFF";
		}
		else
		{
			data.color = "#"+data.color;
		}
		visits.push(new Visit(data));
		var typer = typeSeen(types, data.name);
		if(typer == null)
		{
			var vis = new Type(data);
			types.push(vis);
			$("#legend").prepend(legendMarkup(vis));
		}
		else
		{
			typer.count += 1;
			$("#"+typer.name).html(typer.displayName());
		}
		
	});;
}

$(document).ready(function(){
	initializeSocket();
	setInterval(loop, 1000/30);
	setInterval(cleanup, 1000);
});


function loop(){
	dropDraw();
	speedDraw();
}

function dropDraw(){
	ctx.clearRect(0,0,canWidth,canHeight);
	_.each(visits, function(visit){
		ctx.fillStyle = visit.color;
		//ctx.fillRect(visit.x, visit.y, cubeSize, cubeSize);
		ctx.beginPath();
		ctx.arc(visit.circleX, visit.y, 10, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
		visit.tickDrop();
	});
}

function speedDraw(){
	//chctx.clearRect(0,0,chcanvas.width, chcanvas.height);
	chctx.putImageData(chctx.getImageData(6, 0, chcanvas.width, chcanvas.height), 0, 0);
	chctx.strokeStyle = "#333";
	chctx.lineWidth = 5;
	chctx.beginPath();
	chctx.moveTo(chcanvas.width - 10, chcanvas.height);
	chctx.lineTo(chcanvas.width - 10, chcanvas.height - ((nps+1) * 10));
	chctx.stroke();
	chctx.closePath();
	//chctx.fillText(nps, 10, 20);
}

function cleanup(){
	while(visits.length > 0 && visits[0].y > canHeight){
		visits.shift()
	}
	nps = npsAccumulator;
	npsAccumulator = 0;
}

//We need a Visit class
//This holds both visit details and rendering information
function Visit(data){
	this.color = data.color;
	this.name = data.name;
	this.x = randomCol() * cubeSize;
	this.y = -1 * cubeSize;
	this.circleX = (randomCol() * cubeSize) + (cubeSize/2);
	this.tickDrop = function(){
		this.y += speed;
	};
}

function Type(data){
	this.color = data.color;
	this.name= data.name;
	this.count = 1;
	this.displayName = function(){
		return this.name + "(" + this.count + ")";
	}
}

//Helper Functions
function legendMarkup(type){
  return "<li><div class='indicator' style='background-color: "+ type.color +";'></div><p id='" + type.name + "'>" + type.displayName() + "</p></li>"; 
}

function randomCol(){
	return Math.floor(Math.random()*(cols));
}

function typeSeen(array, type){
	var seen = null;
	for(var i=0; i<array.length;i++)
	{
		if(array[i].name == type){
			seen = array[i];
			break;
		}
	}
	return seen;
}