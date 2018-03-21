var express = require('express');
var app = express();
app.listen(3000,function(req,res){
    console.log("Connected....");
})

var row;

app.get('/',function(req,res){
    
    var html = `<!DOCTYPE html>
    <html>
    <meta charset="UTF-8">
    <head>
    <title>홈입니다.</title>
    </head>
    
    <body>
    <h2> This is homepage </h2>
    <hr><hr>
    <h3>안녕하세요!!</h3> <br>
    글 목록 :  <div style="border: 2px solid red; width:500px; height:400px">
  
                <a href="#" onclick="read(1)">${row[0].title}</a> <br>
                <a href="#" onclick="read(999)">${row[1].title}</a> <br>
    </div> <br>
    제목 : <input type="text" style="width:200px"></input> <br><br>
    내용 : <input id="text" type="text" style="width:200px; height:200px"></input> <br><br>
    <div style="width:250px"> <button style="float:right">글 수정</button> </div>
    
    </body>
    <script type="text/javascript">
    function read(id){
        window.location.href=""+id;
    }
    </script>
    </html>`;
    res.send(html);
})

app.get('/1',function(req,res){
    res.send(row[0].description);
})
app.get('/999',function(req,res){
    res.send(row[1].description);
})


var mysql = require('mysql');
var connection = mysql.createConnection({
    host : '127.0.0.1',
    user : 'root',
    password : 'worn1215',
    port : "3307",
    database : 'my_db'
    
});

connection.connect();

connection.query('SELECT * from topic', function (error, rows, fields) {
    if (error) {throw error;}
    else{
        row = rows;
    console.log('rows', rows);
    //console.log('fields',fields);
    }
});

//var str = 'UPDATE topic SET id=999 where id=100 ';
//connection.query(str, function (error, rows, fields) {
//    if (error) {throw error;}
//    else{
//    console.log('rows', rows);
    //console.log('fields',fields);
//    }
//});


connection.end();