var express = require('express');
var app = express();
var session = require('express-session');
var mysql = require('mysql');
var MySQLStore = require('express-mysql-session')(session);    // 위의 변수 session을 괄호에 넣어준다. ( 파일 세션은 그냥 세션을 의존함)
var bodyparser = require('body-parser');

app.use(bodyparser.urlencoded({extended: true}));
app.set('view engine','ejs');
app.listen(80,function(req,res){
    console.log('서버 실행');
});

var pool = mysql.createPool({
    host : 'localhost',
    password : 'worn1215',
    user : 'root',
    port : 3307,
    database : 'nodejs'
});


app.use(session({
    secret : 'asdasdasdasdasd', // 세션 아이디 암호화용 키
    resave : false, // 
    saveUninitialized : true, //
    store : new MySQLStore({
        host : 'localhost',
        port : 3307,
        user : 'root',
        password : 'worn1215',
        database : 'nodejs'
    })
}))

// -------------- 비밀번호 보안을 위한 코드 ---------------------
var bkfd2Password = require('pbkdf2-password');
var hasher = bkfd2Password();
var sha256 = require('sha256');
// ----------------------------------------------------------

//--------------- 인증을 위해서 ------------------
var passport = require('passport');
var NaverStrategy = require('passport-naver').Strategy;
var KakaoStrategy = require('passport-kakao').Strategy;
app.use(passport.initialize());
app.use(passport.session());

passport.use(new NaverStrategy({
        clientID: 'JClqCQMR1OnX0M7_n02W',
        clientSecret: 'TAmC1wD3Iv',
        callbackURL: "/auth/naver/callback"
      },
     function(accessToken, refreshToken, profile, done) {
        console.log(profile);
        var authId = 'naver'+profile.id;
        var sql = "select * from users where authId=?";

        pool.getConnection(function(err,connection){
            if ( err ){
                console.error('mysql error');
            }else{
    
                
                connection.query(sql,[authId],function(err,result){
                    if ( err ){
                        console.error('mysql select error');
                    }else{
                        if ( result.length > 0 ){
                            done(null,result[0]);
                            connection.release();
                        }else{
                            var newuser = {
                                'authId':authId,
                            }
                            var sql = 'insert into users set ?';
                            connection.query(sql,newuser,function(err,result){
                                if ( err ){
                                   console.log("네이버 oauth 사용자 등록 EORROR");
                                    done('Error');
                                }else{
                                    done(null,newuser);
                                    connection.release();
                                }
                            })
                        }
 
                    }
                })
            }
        })
        
      }
));

passport.use(new KakaoStrategy({
    clientID: '67ab8de6573dc6e652e0b0e4ea7f223c',
    clientSecret: 'wvwybkodUfWo2HKKspDbpiK2YFoUzJgh',
    callbackURL: "/auth/kakao/callback"
  },
 function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    var authId = 'kakao'+profile.id;
    var sql = "select * from users where authId=?";

    pool.getConnection(function(err,connection){
        if ( err ){
            console.error('mysql error');
        }else{

            
            connection.query(sql,[authId],function(err,result){
                if ( err ){
                    console.error('mysql select error');
                }else{
                    if ( result.length > 0 ){
                        
                        done(null,result[0]);
                        connection.release();
                    }else{
                        
                        var newuser = {
                            'authId':authId,
                            'displayName':profile.displayName
                        }
                        
                        var sql = 'insert into users set ?';
                        connection.query(sql,newuser,function(err,result){
                            if ( err ){
                               console.log("카카오 oauth 사용자 등록 EORROR");
                                done('Error');
                            }else{
                                done(null,newuser);
                                connection.release();
                            }
                        })
                    }

                }
            })
        }
    })
    
  }
));

passport.serializeUser(function(user,done){
    //console.log('serializeUser\n',user);
    
    done(null,user.authId);
})
passport.deserializeUser(function(data,done){
    var sql = 'select * from users where authId=?';
    pool.getConnection(function(err,connection){
        if ( err ){
            console.error('mysql error');
        }else{
            connection.query(sql,[data],function(err,result){
                if ( err ){
                    console.error('mysql find error');
                    done(null,null);
                }else{
                    //console.log(result);
                    if (result[0] ){
                        console.log(result[0]);
                        done(null,result[0]);
                    }else{
                        done(null,null);  // db에서 계정보가 날라가면 무세션으로 다시 페이지 접속 유도
                    }
                    connection.release();
                    
                }
            })
        }
    })

})
            // oauth 이용에는 두개의 인증 과정이 필요함.
app.get('/auth/naver',passport.authenticate('naver'));
app.get('/auth/naver/callback',passport.authenticate('naver',{successRedirect:'/welcome',failureRedirect:'/login'}));

app.get('/auth/kakao',passport.authenticate('kakao'));
app.get('/auth/kakao/callback',passport.authenticate('kakao',{successRedirect:'/welcome',failureRedirect:'/login'}));

//-------------------------------



app.get('/',function(req,res){
    res.send('hi');
})



app.get('/welcome',function(req,res){
    
    if ( req.user.displayName){
        res.send('<h1> hello '+req.user.displayName+"</h1> <a href='/logout'>logout</a>");
    }
    else if ( req.session.displayName ){

        res.send('<h1> hello '+req.session.displayName+"</h1> <a href='/logout'>logout</a>");
    }else{
        res.send('<h1> login is failed </h1> <a href="/login">login</a>');
    }
    
})

app.get('/login',function(req,res){
    res.render(__dirname+'/sessionview/views/login');
})

app.get('/logout',function(req,res){
    delete req.session.displayName ;
    req.session.save(function(){  // save 이유? 세션 정보가 변경 되고 나서 리다이렉트 됨을 보장.
        res.redirect('/login');
    })
    
})

app.get('/register',function(req,res){
    res.render(__dirname+'/sessionview/views/register');
})

app.post('/auth/register',function(req,res){
    var authId = req.body.authId;
    var username = req.body.username;
    var passwd = req.body.passwd;
    var email = req.body.email;
    var displayName = req.body.displayName;
    
    
    hasher({password:passwd},function(err,pass,salt,hash){

        if ( err ){
            console.error('비밀번호 해시 생성중 오류 발생');
        }else{
        
        var datas = [authId,salt,username,hash,displayName,email];

        pool.getConnection(function(err,connection){
            if ( err ){
                console.error('mysql error');
            }else{
    
                var sql = "insert into users(authId,salt,username,password,displayName,email) values(?,?,?,?,?,?)";
    
                connection.query(sql,datas,function(err,result){
                    if ( err ){
                        console.error('mysql insert error');
                    }else{
                        connection.release();
    
                        res.redirect('/login');
                    }
                })
            }
        })

        }

    })

})

app.post('/auth/login',function(req,res){

    var id = req.body.id;
    var passwd = req.body.passwd;

    pool.getConnection(function(err,connection){
        if ( err ){
            console.error('mysql error');
        }else{
            var saltsql = "select salt from users where authId='"+id+"'";
            
            connection.query(saltsql,function(err,saltresult){
                if ( err ){
                    console.error(saltsql+' mysql password error');
                }else{

                    var salt = saltresult[0].salt;
                    hasher({password:passwd,salt:salt},function(err,pass,salt,hash){  // 콜백 함수의 변수 hash는 소트+패스워드가 해시화된 결과값

                        var sql = "select * from users where authId='"+id+"' and password='"+hash+"'";
                        
                        try{
                        connection.query(sql,function(err,result){
                            if ( err ){
                                throw selectE;
                                //console.error('mysql select error');
                            }else{
            
                                    req.session.displayName = result[0].displayName;
                                    req.session.save(function(){    // save 함수 쓰는 이유? db에 세션이 정보가 저장 되기전에 리다이렉트 되는 것을 방지
                                        res.redirect('/welcome');
                                    })
                                
            
                                connection.release();
                            }
                        })
            
                        }catch(selectE){
                            res.send('login fail <a href="/login">return to login</a> ');
                        }

                    })
                    

                }
            })

            
        }
    })

  
    
    
})

