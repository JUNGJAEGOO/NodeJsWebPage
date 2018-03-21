var express = require('express');
var fs = require('fs');
var mysql = require('mysql');
var bodyparser = require('body-parser'); // post방식의 body를 사용하기 위하여
var app = express();
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}))  // post 방식의 body를 사용을 위하여.
var connection = mysql.createConnection({

})
app.listen(3000,function(req,res){
console.log("hello, this is home page!");
});
app.get('/hi',function(req,res){
res.send('hi');
});
app.get('/',function(req,res){
res.sendFile(__dirname + '/home.html');
});

app.set('view engine','jade');

app.get('/form',function(req,res){
	res.render('form');
});
app.post('/form_receiver',function(req,res){
	var title = req.body.title;
	var description = req.body.description;
	res.send("this is post <br> title :"+title+"<br>"+"desc: "+description);
});
app.get('/form_receiver',function(req,res){
	var title = req.query.title;
	var description = req.query.description;
	res.send("this is get <br> title :"+title+"<br>"+"desc: "+description);
})

app.get('/topic', function(req, res){
	var topics = [
	  'Javascript is....',
	  'Nodejs is...',
	  'Express is...'
	];
	var output = `
	<a href="/topic?id=0">JavaScript</a><br>
	<a href="/topic?id=1">Nodejs</a><br>
	<a href="/topic?id=2">Express</a><br><br>
	${topics[req.query.id]}
	`
	res.send(output);
  })

app.get('/public/sana1.jpg',function(req,res){
	fs.readFile(__dirname+'/public/sana1.jpg',function(error,data){
			res.writeHead(200,{'Content-Type':'text/html'});
			res.end(data);
	});
	
});
app.get('/public/sana2.jpg',function(req,res){
	fs.readFile(__dirname+'/public/sana2.jpg',function(error,data){
			res.writeHead(200,{'Content-Type':'text/html'});
			res.end(data);
	});
});

