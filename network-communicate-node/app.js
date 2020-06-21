var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var totalNode = 0;
var pendingResult = [];
// event network
io.on("connection", function (socket) {
	totalNode++;
	console.log(
		"New node join network: ",
		socket.id,
		". Total node: ",
		totalNode
	);

	socket.on("disconnect", function () {
		totalNode--;
		console.log(
		"A node leave network: ",
		socket.id,
		". Total node: ",
		totalNode
		);
	});
	socket.on("voting", (ballot) => {
		ballot = {id: socket.id, ballot : ballot};
		io.emit("validate-voting", ballot);
		pendingResult.push({client: socket, ballot : ballot});
	});
	socket.on('validated-ballot', (data)=>{
		var resElement;
		for (let i = 0, length = pendingResult.length; i < length; i++ ){
			if(pendingResult[i].ballot.id == data.id && JSON.stringify(pendingResult[i].ballot.ballot) == JSON.stringify(data.ballot)){
				resElement = pendingResult[i];
				pendingResult.splice(i, 1);
				break;
			}
		}
		if(resElement){
			resElement.client.emit('get-result', resElement.ballot);
		}
	})
});
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = {
  app: app,
  io: io,
  server: server,
};
