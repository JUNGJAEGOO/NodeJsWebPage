var express = require('express');
var dt = require('date-utils');
var app = express();
var fs = require('fs');
var mysql = require('mysql');
var bodyparser = require('body-parser');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session); 
var pool = mysql.createPool({
    host : 'localhost',
    password : 'worn1215',
    user : 'root',
    port : 3307,
    database : 'nodejs'
});

app.use(session({
    secret:'12sdfasdasdasd',
    resave : false,
    saveUninitialized : true,
    store : new MySQLStore({    // mysql 로 세션 저장하기위해서 필수
        host : 'localhost',
        port : 3307,
        user : 'root',
        password : 'worn1215',
        database : 'nodejs'
    })
}))

/// 비밀번호 보안 
var bkfd2Password = require('pbkdf2-password');
var hasher = bkfd2Password();
var sha256 = require('sha256');
/// ---------------------------------


app.use(function(req,res,next){      // ejs에 넘겨줄 전역변수로 세션정보를 설정
    res.locals.user = req.session;
    next();
})

app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static(__dirname+'/public'));
app.listen(80,function(req,res){
    console.log("Connected... port is 3000!......");
});
app.set('view engine','ejs');


app.get('/',function(req,res){
    res.redirect('/home');
});

app.get('/home',function(req,res){
    
        res.render('home',{title : '홈'});
    
});

app.get('/about',function(req,res){
    res.render('about',{title : '어바웃'});
});

app.get('/board',function(req,res){
    var boardid = req.param('page');
    if( typeof boardid === "undefined"){ boardid = 1; }
   
    var results;
    pool.getConnection(function(err,connection){
        if ( err ){
            console.error('my sql error');
        }else{
            var sql = 'select idx,title,name,description,date_format(date,"%Y-%m-%d") date,view,isFormal from topic';
            
            connection.query(sql,function(err,result){
                if( err){
                    console.error(err);
                    throw err;
                }
                else{
                    //console.log(result);
                    results = result;
                    res.render('board',{title : '게시판', boards: results, page:boardid});
                    connection.release();
                    }
            })
        }
    })
    
});

app.get('/madenote',function(req,res){
    res.render('madenote',{title : '제작 기록'});
});

app.get('/board/writeform',function(req,res){
    res.render('writeform',{title : '글 작성화면'});
});

app.post('/board/writeupdate',function(req,res){
    var title = req.body.title;
    var name = req.body.name;
    var description = req.body.description;
    var datas = [title,name,description];
    var idx = req.body.id;
    pool.getConnection(function(err,connection){
        if( err){
            console.error(err);
            throw err;
        }else{
            var sql = 'update topic set title=?,name=?,description=?,modidate=now() where idx ='+idx;
            connection.query(sql,datas,function(err,res){
                if( err){
                    console.error(err);
                    throw err;
                }
                console.log("글 수정완료");
                connection.release();
            })
        }
    })
    res.redirect('/board');
});

app.post('/board/ensuredelete',function(req,res){
    var idx = req.param("idx");
    var pass = req.param("password");
    res.render('ensuredelete',{idx:idx, password:pass});
    

})

app.post('/board/delete',function(req,res){
    var idx = req.body.idx;

    pool.getConnection(function(err,connection){
        if( err){
            console.error(err);
            throw err;
        }else{
            var sql = 'delete from topic where idx = '+idx;
            connection.query(sql,function(err,res){
                if( err){
                    console.error(err);
                    throw err;
                }
                console.log("삭ㅋ제ㅋ");
                connection.release();
            })
        }
    })

    res.redirect('/board');
})

app.get('/board/modify',function(req,response){
    var idx = req.param('idx');
    
    pool.getConnection(function(err,connection){
        if( err){
            console.error(err);
            throw err;
        }else{
            var sql = 'select * from topic where idx = '+idx;
            connection.query(sql,function(err,res){
                if( err){
                    console.error(err);
                    throw err;
                }else{
                //console.log(res[0]);
                response.render('writeupdate',{title:"글 수정",idx:res[0].idx,titles:res[0].title,name:res[0].name,desc:res[0].description,password:res[0].password});
                }
                connection.release();
            })
        }
    })

    
})

// 댓글 삽입 
app.post('/replyadd',function(req,res){
    
    var idx = req.body.boardnumber;   // 댓글의 번호가 아니라 댓글이 연동된 글의 번호.
    var name = req.body.replynick;
    var password = req.body.replypass;
    var text = req.body.replytext;
    var datas = [idx,name,password,text];
    console.log(datas);

    var query = "insert into reply(topic_id,name,password,description) values(?,?,?,?)";
    pool.getConnection(function(err,connection){
        if( err){
            console.error(err);
            throw err;
        }else{
            
            connection.query(query,datas,function(err,res){
                if( err){
                    console.error(err);
                    throw err;
                }
                connection.release();
            })
        }
    })

    res.redirect('/board/boardview?id='+idx);

})

app.get('/board/boardview',function(req,res){
    var contentid = req.param('id');
    //console.log(contentid);
    

    pool.getConnection(function(err,connection){
        if( err){
            console.error(err);
            throw err;
        }else{
            var sql2 = 'update topic set view = view + 1 where idx = '+contentid;
            connection.query(sql2,function(err,res){
                if( err){
                    console.error(err);
                    throw err;
                }
                //console.log("조회수 1 증가");
                connection.release();
            })
        }
    })
   
    pool.getConnection(function(err,connection){
        if ( err ){
            console.error('my sql error');
        }else{
           
            var sql3 = 'select name,description,date_format(date,"%Y-%m-%d") date from reply where topic_id='+contentid;
            var replies;
            connection.query(sql3,function(err,replyres){
                if( err){
                    console.error(err);
                    throw err;
                }
                    
                    var sql = 'select * from topic where idx=?';
                    connection.query(sql,contentid,function(err,result){
                        if( err){
                            console.error(err);
                            throw err;
                        }
                    else{
                            res.render('boardview',{title : '글 보기', boardidx : result[0].idx,
                            boardtitle: result[0].title, boardname: result[0].name, boardpassword : result[0].password,
                            boardconts: result[0].description.replace(/\r\n/g,'<br>'), boardtime:result[0].date, 
                            boardview:result[0].view, replyres,boardformal:result[0].isFormal});
                            connection.release();
                        }
                    })
            })
    
        }
     })
    //res.render('boardview',{title: '글 보기',content: conts});
})

app.post('/board/write',function(req,res){
    
    var title = req.body.title;
    var name = req.body.name;
    var description = req.body.description;
    var password = req.body.password;
    var isFormal = req.body.isFormal;
    
    var datas= [name,password,title,description,isFormal];  // 변수 time 의 원 db에서 컬럼명은 date
    //console.log(datas);
   
    var sql = "insert into topic(name,password,title,description,isFormal) values(?,?,?,?,?)";

    pool.getConnection(function(err,connection){
        if( err){
            console.error(err);
            throw err;
        }
        else{
            connection.query(sql,datas,function(err,result){
                if( err){
                    console.error(err);
                    throw err;
                }
                else{
                    console.log("등록 완료");
                    connection.release();
                    res.redirect('/board');
                    
                }
            })
        }
    })
    
    
})

app.get('/upcoming',function(req,res){
    res.render('upcoming',{title : 'Upcoming'});
});

app.get('/maps',function(req,res){
    res.render('maps',{title : 'MAPS'});
});

app.get('/signin',function(req,res){
	res.render(__dirname+'/views/userinfo/signin',{title: '회원가입'});
})

app.post('/signinpost',function(req,res){
    var displayName = req.body.displayName;
    var username = req.body.username;
    var authId = req.body.id;
    var passwd = req.body.password;
    var birth = req.body.birth;
    var email = req.body.email;
    
    pool.getConnection(function(err,connection){
        if ( err ){
            console.error('회원가입 오류');
        }else{
                hasher({password:passwd},function(err,pass,salt,hash){
                        if ( err ){
                            console.error('비밀번호 해시 생성중 오류 발생');
                        }else{
                            
                            var datas = [authId,hash,username,salt,displayName,birth,email];
                            var sql = 'insert into users(authId,password,username,salt,displayName,birth,email) values(?,?,?,?,?,?,?)';
                            
                            connection.query(sql,datas,function(err,result){
                                if( err){
                                    console.error(err);
                                    throw err;
                                }
                                else{
                                    res.render(__dirname+'/views/userinfo/signsuccess',{title : '회원가입 성공'});
                                    connection.release();
                                }
                            })
                        }
                })

            
        }
    })
})

app.get('/logout',function(req,res){
    delete req.session.displayName;
    res.redirect('/');
})

app.post('/auth/login',function(req,res){
    
        var id = req.body.id;
        var passwd = req.body.password;
    
        pool.getConnection(function(err,connection){
            if ( err ){
                console.error('mysql error');
            }else{
                var saltsql = "select salt from users where authId='"+id+"'";
                
                connection.query(saltsql,function(err,saltresult){
                    if ( err ){
                        console.error(saltsql+' mysql password error');
                    }else{
    
                        var usersalt = saltresult[0].salt;
                        
                        hasher({password:passwd,salt:usersalt},function(err,pass,salt,hash){  // 콜백 함수의 변수 hash는 소트+패스워드가 해시화된 결과값
                            
                            var sql = "select * from users where authId='"+id+"' and password='"+hash+"'";
                            
                            
                            try{
                            connection.query(sql,function(err,result){
                                if ( err ){
                                    throw selectE;
                                }else{
                                    if ( result.length > 0 ){
                                        
                                        req.session.displayName = result[0].displayName;
                                        req.session.save(function(){    // save 함수 쓰는 이유? db에 세션이 정보가 저장 되기전에 리다이렉트 되는 것을 방지
                                            res.redirect('/');
                                        })
                                    }else{
                                        res.send('login fail <a href="/home">return to home</a> ');
                                    }
                
                                    connection.release();
                                }
                            })
                
                            }catch(selectE){
                                res.send('login fail <a href="/home">return to home</a> ');
                            }
    
                        })
                        
    
                    }
                })
    
                
            }
        })
})

