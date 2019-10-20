var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var conf = require('./config');
var md5 = require('md5');
// const PORT = process.env.PORT || 5000

const Pool = require('pg').Pool
const db = new Pool({
    user: conf.sql.user,
    host: conf.sql.host,
    database: conf.sql.database,
    password: conf.sql.password,
    port: conf.sql.port,
    ssl:conf.sql.ssl
});

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
  });




io.set('origins', '*:*');

server.listen(3001, function () {
    console.log('listening on *:3001');
});

var x;
var tutar;
io.on('connection', function (socket) {

    console.log(md5('Çağatay'));

     var mayinlar = [];
     var oranlar = [];
     var mayinvarmi=false
    console.log("connect user")
     db.query(`select "totalpoint" from public."User" where "id" = 1`,(error, results) =>{
        if(error){
            console.log(error);
        }
        else{
           var bakiye =  results.rows[0].totalpoint;
           socket.emit('cuzdan',bakiye);
           console.log(bakiye);
        }
    });


const game = {
    activegameid:0,
    startgame: (game)=>{
        tutar = game.tutar;


        var kullaniciparadurum = 0;

        db.query('select totalpoint from public."User" where id = 1', (error, results) => {
            if (error) {

            }
            else {
                var total = results.rows[0].totalpoint;
                if (Number(tutar) <= Number(total)) {
                    console.log("OK!")
                    kullaniciparadurum = 1;
                }
                if(kullaniciparadurum == 1)
                {
                    db.query(`INSERT INTO public."Game"(adddate, levelid) VALUES ( now(), ` + game.level + `) RETURNING id;`, (error, results) => {
                        if (error) {
            
                        }
                        else {
                            game.activegameid = results.rows[0].id;
                        }
                    });
                    var satirmayin = [];
                    var oran = 1;
                    for (i = 0; i < 10; i++) {
                        for (j = 0; j < game.level; j++) {
                            var mayin = Math.floor(Math.random() * 4) + 1;
                            if (!satirmayin.includes(mayin)) {
                                satirmayin.push(mayin);
                            }
                            else {
                                j--
                            }
                        }
                        mayinlar.push(satirmayin);
                        satirmayin = [];
                        oran = oran * 1.17 * game.level;
                        oranlar.push(oran);
                    }
            
                    db.query('update public."User" set totalpoint = totalpoint -' + tutar + 'where id = 1', (error, results) => {
                        if (error) {
            
                        }
                        else {
                            console.log("Kullanıcı parası bende!!" + tutar);
                        }
            
                    });
            
                    socket.emit("sendmayin", mayinlar);
                    socket.emit("oranlarigoster", oranlar);
                    socket.emit("cuzdandusur",game.tutar);
            
                }
                else{
                    console.log(kullaniciparadurum);
                    socket.emit("parayok");
                }
            }
        });
    },
    oyna:(oyundata)=>{
        x = oyundata.linenumber;
        var tiklananmayin = Number(oyundata.tiklanan);
        for (i = 0; i < 2; i++) {
            if (mayinlar[x][i] == tiklananmayin) {
                game.mayinvarmi = true;
                socket.emit('crash');
            }
        }
        if (!mayinvarmi) {
            x++;
            socket.emit('continue', x);
        }
    },
    cek:()=>{
        var result = oranlar[x - 2] * Number(tutar);
        socket.emit("endgame", result);

        //gamuser tablosuna insert işlemi yap. userid sallayabilirsin
        db.query(`INSERT INTO public."GameUser"( gameid, point, bet,userid)
           VALUES (`+ game.activegameid + `, ` + oranlar[x - 2] + `, ` + tutar + `,1);`, (error, results) => {
            if (error) {

            }
            else {
                db.query('update public."User" set totalpoint = totalpoint +' + result + 'where id = 1', (error, results) => {
                    if (error) {

                    }
                    else {
                        console.log("Kullanıcı parası güncellendi!");
                    }

                });
            }
        });
    }
}









socket.on('disconnect', function () {
    io.to(socket.id).emit("by");

});
    socket.on('startgame', game.startgame)
    socket.on('oyna', game.oyna)
    socket.on('cek', game.cek)
});