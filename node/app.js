var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
global.connecter = require('socket.io-client')('http://localhost:3000');
var app = express();
var miner = new (require('./miner/block-chain').blockChain)();
connecter.emit('voting', {name: 'tra'});
connecter.on('validate-voting', (data)=>{
	miner.createTransaction(data);
	let newBlock = miner.miningPendingTransactions();
	if(newBlock !== false){
		connecter.emit('validated-ballot', {
		newBlock: newBlock,
		preBlock : miner.getLatestBlock()
		});
	}
});
connecter.on('get-result', (data)=>{
	  console.log('res: ', data);
	  console.log('require-list-chain');
	  connecter.emit('get-chain');
});
connecter.on('receive-lastest-block', (lastestBlock)=>{
	// let lastestBlock = miner.getLatestBlock();
		
});
connecter.on('require-send-list-chain',()=>{
	connecter.emit('get-list-chain',miner.getListChain());
})
connecter.on('receive-chain', (chains)=>{
	console.log('receive list block chain', chains[1].transactions);
})
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = {
	app: app,
	connecter : connecter
};
