'use strict';
var url = require('url');
var Firebase = require('firebase');
var changeCase = require('change-case')
var fs = require("fs")
var sendgrid = require("sendgrid")("Jakobhartman","Dangers1177"); 
var express = require("express")
var app = express()


var cardCount = 15418;
var PORT = process.env.PORT || 5000;
var server = app.listen(PORT, function() {
	//Callback triggered when server is successfully listening. Hurray!
	console.log('Listening on port ' + PORT);
});


//For all your static (js/css/images/etc.) set the directory name (relative path).
app.use(express.static(__dirname + '/assets'));

app.post("/register",function(req,res){
  console.log("Sending Mail")
    var payload   = {
      to      : 'Jakobhartman@hotmail.com',
      from    : 'Jakobhartman@hotmail.com',
      subject : 'Saying Hi',
      text    : 'This is my first email through SendGrid'
    }
    
    sendgrid.send(payload, function(err, json) {
        if (err) { console.error(err); }
        console.log(json);
    });
    res.end()
});

app.post("/validateEmail",function(req,res){
  
})

//A sample GET request
app.get('/', function(req, res) {
	fs.readFile('assets/views/index.html',function(er,html){
    if(er){
      console.log(er)
    }
    res.writeHeader(200, {"Content-Type": "text/html"});
    res.write(html);
    res.end();
  })
})

app.get('/register', function(req, res) {
	fs.readFile('assets/views/register.html',function(er,html){
    if(er){
      console.log(er)
    }
    res.writeHeader(200, {"Content-Type": "text/html"});
    res.write(html);
    res.end();
  })
})


function getParams(urlText){
  //urlText = urlText.split("&")
  console.log(urlText)
  var str = {token:"",team_id:"",team_domain:"",channel_id:"",channel_name:"",user_id:"",user_name:"",command:"",text:""}
  // for(var i = 0;i < urlText.length;i++){
  //   var index = urlText[i].indexOf("=");
  //   urlText[i] = urlText[i].substring(index + 1,urlText[i].length);
  // }
  // str.token = urlText[0];
  // str.team_id = urlText[1];
  // str.team_domain = urlText[2];
  // str.channel_id = urlText[3];
  // str.channel_name = urlText[4];
  // str.user_id = urlText[5];
  // str.user_name = urlText[6];
  // str.command = urlText[7];
  // str.text = urlText[8];

  return str
}

//A sample POST request
app.post('/card', function(req, res) {
	// var params = getParams(req.body);
  console.log("response body: " + req.body + "response params: " + req.params + "reponse query: " + req.query)
  res.end()
	// var card = params.text;
	// var channel = params.channel_name;
	// var team = params.team_id;
	// var client = '';
  // var slackURL = new Firebase("https://slackintergrationmtg.firebaseio.com/slacks/" + team);
  // slackURL.once("value",function(child){
  //   client = child.val()
  //   if(card === 'random') {
  //     getRandomCard(channel, client);
      
  //   }else if(card === 'random10'){
  //     for(var i = 0;i < 10;i++){
  //       getRandomCard(channel, client)
  //     }
  //   } else{
  //     getCard(card,channel,client,res);

  //   }
  // })
 })

function postToSlack(channel, client, cardURI) {
	var slack = require('slack-notify')('https://hooks.slack.com/services/' + client);
	slack.send({
		channel: '#' + channel,
		text: cardURI,
		username: 'GathererBot'
	});

	slack.onError = function(err) {
		console.log(err.toString());
	};
}

function getRandomCard(channel, client) {
  var ref = new Firebase('https://magictgdeckpricer.firebaseio.com/MultiverseTable/');
	ref.once('value', function(child) {
		var rNum = Math.floor((Math.random() * cardCount) + 0);
		var cards = child.val();
		var cName = Object.keys(cards)[rNum];
    ref = new Firebase('https://magictgdeckpricer.firebaseio.com/MultiverseTable/' + cName + "/ids");
    ref.once("value",function(child){
      var length = Object.keys(child.val()).length;
      var rnNum = Math.floor((Math.random() * (length - 1)));
      ref = new Firebase('https://magictgdeckpricer.firebaseio.com/MultiverseTable/' + cName + "/ids/" + Object.keys(child.val())[rnNum]);
      ref.once("value",function(child){
        var mId = child.val()
        var uri = 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + mId + '&type=card';
        postToSlack(channel, client, uri);
      })
      
    })
    
	})
}

function getCard(card,channel,client){
  
  card = sanitizeName(card)
  var ref = new Firebase('https://magictgdeckpricer.firebaseio.com/MultiverseTable/' + card + "/ids");
    ref.once('value',function(child){
        if(child.val() !== null){
          var length = child.numChildren();
          var rnNum = Math.floor((Math.random() * (length - 1)));
          var getIds = child.val()
          var key = Object.keys(getIds)[rnNum]
          var mId = getIds[key]
          var uri = 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + mId + '&type=card';
          if(mId == undefined){
            res.end("Could not find Multiverse ID\n")
          }else{
            postToSlack(channel, client, uri);
          }
      }else{
        res.end("Bad Card Name\n")
      }
    })

}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}

function sanitizeName(card){
  var hiphen = card.indexOf("-");
  if(hiphen != -1){
    card = card.replaceAt(hiphen," ");
  }
  card = changeCase.titleCase(card)
  if(hiphen != -1){
    card = card.replaceAt(hiphen,"-")
  }
  card = card.replace("Of","of");
  card = card.replace("The","the");
  return card
}

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}
