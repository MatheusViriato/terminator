// var twilio = require('twilio');
var express = require('express');
var app = express();
var xml = require('xml');
var bodyParser = require("body-parser");
var mysql = require('mysql');

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

const con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE,
    port: process.env.PORT_DB
});

const port = process.env.PORT;

var cellphone = '';
var userMessage = '';

// var accountSid = 'AC14f751338ac223f4ace9c3ba7d33948a';
// var authToken = '06addbe70348d1ab4c1144bbde690ea8';
// var client = new twilio(accountSid, authToken);

// chatbot.message({workspace_id}, trataResposta);

function callbackMessage(err, response){
    //caso tenha erro
    if(err){
        console.log(err);
        return;
    }

    //detectando intenção do usuário
    if(response.intents.length > 0){
        console.log('Eu detectei a intenção: ' + response.intents[0].intent);
        //verificando se a intenção é despedida para fim de conversa
        // if(response.intents[0].intent == 'despedida'){
        //     fimDeConversa = true;
        // }
    }

    //exibe a resposta do diálogo, caso aja
    if(response.output.text.length > 0){
        saveWatsonResponse(response.output.text[0], cellphone);
        saveContext(response.context, cellphone);
        saveAllChat(cellphone, response.context, userMessage, response.output.text[0]);
    }
}

// var sql = "delete from sessao_watson where cel = 'whatsapp:+5511983656701'";
// con.query(sql, function (err, result) {
//     if(!err) console.log('Contexto salvo!');
//     else console.log(err);
// });

// var sql = "delete from cardapio_padrao";
// con.query(sql, function (err, result) {
//     if(!err) console.log('Contexto salvo!');
//     else console.log(err);
// });

// var sql = "update sessao_watson set cel = '1' where cel = 'whatsapp:+5511983656701'";
// con.query(sql, function (err, result) {
//     if(!err) console.log('Contexto salvo!');
//     else console.log(err);
// });

// var sql = "update sessao_watson set contexto = '' where cel = 'whatsapp:+5511983656701'";
// con.query(sql, function (err, result) {
//     if(!err) console.log('Contexto salvo!');
//     else console.log(err);
// });

// var sql = "update sessao_watson set resposta_watson = '' where cel = 'whatsapp:+5511983656701'";
// con.query(sql, function (err, result) {
//     if(!err) console.log('Contexto salvo!');
//     else console.log(err);
// });

function saveAllChat(cellphone, context, userMessage, watson_response){
    var sql = "insert into informacao_chat(cel, contexto, mensagem_usuario, resposta_watson) values('" + cellphone + "', '" + JSON.stringify(context) + "', '" + userMessage + "', '" + watson_response + "') ";
    con.query(sql, function (err, result) {
        if(!err) console.log('Usuário cadastrado!');
        else console.log(err);
    });
}

function saveContext(context, cellphone){
    var sql = "update sessao_watson set contexto = '" + JSON.stringify(context) + "' where cel = '" + cellphone + "'";
    con.query(sql, function (err, result) {
        if(!err) console.log('Contexto salvo!');
        else console.log(err);
    });
}

function getContext(callback, cellphone){
    var sql = "select contexto from sessao_watson where cel = '" + cellphone + "'";
    con.query(sql, function (err, result) {
        callback(result[0].contexto);
    });
}

function saveWatsonResponse(response, cellphone){
    var sql = "update sessao_watson set resposta_watson = '" + response + "' where cel = '" + cellphone + "'";
    con.query(sql, function (err, result) {
        if(!err) console.log('Resposta do watson salva!');
        else console.log(err);
    });
}

function getWatsonResponse(callback, cellphone){
    var sql = "select resposta_watson from sessao_watson where cel = '" + cellphone + "'";  
    con.query(sql, function (err, result) {
        callback(result[0].resposta_watson);
    });
}

function getUser(callback, cellphone){
    var sql = "select cel from sessao_watson where cel = '" + cellphone + "'";  
    con.query(sql, function (err, result) {
        try {
            callback(result[0].cel);
        }
        catch(e){
            callback('');
        }
    });
}

function saveUser(cellphone){
    getUser(function(result){
        if(result === ''){
            var sql = "insert into sessao_watson(cel, mensagem_usuario, resposta_watson, contexto) values('" + cellphone + "', '', '', '') ";
            con.query(sql, function (err, result) {
                if(!err) console.log('Usuário cadastrado!');
                else console.log(err);
            });
        }
    }, cellphone);
}

app.post('/', function (req, res) {

    cellphone = req.body.From;
    saveUser(cellphone);

    // começando a conversação com uma mensagem vazia
    // para forçar o chatbot dar as boas vindas
    userMessage = req.body.Body;

    getContext(function(context){
        if(context != '') var context_obj = JSON.parse(context);
        else var context_obj = {};
        chatbot.message({
            workspace_id,
            input: {text: userMessage},
            context: context_obj
        }, callbackMessage);
    }, cellphone);

    setTimeout(function(){
        getWatsonResponse(function(watson_response){
            res.contentType('application/xml;charset=utf-8');
            console.log(watson_response);
            var body_response = 
            [ 
                {
                    Response: [{
                        Message: [{
                            Body: watson_response
                        }]
                    }]
                } 
            ];
            res.send(xml(body_response));
        }, cellphone);
    }, 2000);
});

app.listen(port, function () {
  console.log('Example app listening on port 3000!');
});