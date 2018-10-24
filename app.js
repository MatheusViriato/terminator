var express = require('express');
var app = express();
// var twilio = require('twilio');
var xml = require('xml');
var bodyParser = require("body-parser");

var mysql = require('mysql');

// var sql = "select * from products";
// con.query(sql, function (err, result) {
//     if (err) throw err;
//     for(var i = 0; i < result.length; i++){
//         response.push({
//             img: result[i].img, 
//             name: result[i].name,
//             description: result[i].description,
//             price: result[i].price
//         })
//     }
//     res.send(response);
// });

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const watson = require('watson-developer-cloud/assistant/v1');
require('dotenv').config();

const chatbot = new watson({
    username: process.env.USER_NAME,
    password: process.env.PASSWORD,
    version: process.env.VERSION,
});

const workspace_id = process.env.WORKSPACE_ID;

let fimDeConversa = false;
var input = null;
let context = null;

// var accountSid = 'AC14f751338ac223f4ace9c3ba7d33948a';
// var authToken = '06addbe70348d1ab4c1144bbde690ea8';
// var client = new twilio(accountSid, authToken);

chatbot.message({workspace_id}, trataResposta);

function trataResposta(err, resposta){
    //caso tenha erro
    if(err){
        console.log(err);
        return;
    }

    //detectando intenção do usuário
    if(resposta.intents.length > 0){
        console.log('Eu detectei a intenção: ' + resposta.intents[0].intent);
        //verificando se a intenção é despedida para fim de conversa
        // if(resposta.intents[0].intent == 'despedida'){
        //     fimDeConversa = true;
        // }
    }

    //exibe a resposta do diálogo, caso aja
    if(resposta.output.text.length > 0){
        console.log(resposta.output.text[0]);
        gravaRespostaWatson(resposta.output.text[0]);
        gravaContexto(resposta.context);
    }
}

var con = mysql.createConnection({
    host: 'j1r4n2ztuwm0bhh5.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'iyh62flymz54wgst',
    password: 'kr4qtc14mibkadnx',
    database: 'w5vreupatooroseh',
    port: 3306
});

// var sql = "update sessao_watson set contexto = '' where cel = '1'";
// con.query(sql, function (err, result) {
//     if(!err) console.log('Contexto salvo!');
//     else console.log(err);
// });

// var sql = "update sessao_watson set resposta_watson = '' where cel = '1'";
// con.query(sql, function (err, result) {
//     if(!err) console.log('Contexto salvo!');
//     else console.log(err);
// });

function gravaContexto(contexto){
    var sql = "update sessao_watson set contexto = '" + JSON.stringify(contexto) + "' where cel = '1'";
    con.query(sql, function (err, result) {
        if(!err) console.log('Contexto salvo!');
        else console.log(err);
    });
}

function getContexto(callback){
    var sql = "select contexto from sessao_watson where cel = '1'";
    con.query(sql, function (err, result) {
        callback(result[0].contexto);
    });
}

function gravaRespostaWatson(resposta){
    var sql = "update sessao_watson set resposta_watson = '" + resposta + "' where cel = '1'";
    con.query(sql, function (err, result) {
        if(!err) console.log('Resposta do watson salva!');
        else console.log(err);
    });
}

function getRespostaWatson(callback){
    var sql = "select resposta_watson from sessao_watson where cel = '1'";  
    con.query(sql, this.teste, function (err, result) {
        callback(result[0].resposta_watson);
    });
}

app.post('/', function (req, res) {

    //começando a conversação com uma mensagem vazia
    //para forçar o chatbot dar as boas vindas
    var mensagemusuario = req.body.Body;

    getContexto(function(contexto){
        var contexto_obj = JSON.parse(contexto);
        chatbot.message({
            workspace_id,
            input: {text: mensagemusuario},
            context: contexto_obj
        }, trataResposta);
    });

    setTimeout(function(){
        getRespostaWatson(function(resposta_watson){
            res.contentType('application/xml');
            var resposta_body = 
            [ 
                {
                    Response: [{
                        Message: [{
                            Body: resposta_watson
                        }]
                    }]
                } 
            ];
            res.send(xml(resposta_body));
        });
    }, 3000);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});