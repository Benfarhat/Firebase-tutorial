const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const express = require('express');
const engines = require('consolidate');
const bodyParser = require('body-parser');
const request = require('request');


const firebaseApp = firebase.initializeApp(
	functions.config().firebase
);

// Some data initialisation to firebase database
function initGenres(){
	const ref = firebaseApp.database().ref('genres');

	ref.push({ name: 'Action', link: "action"});
    ref.push({ name: 'Action', link: "action"});
    ref.push({ name: 'Animation', link: "animation"});
    ref.push({ name: 'Arts Martiaux', link: "artsmartiaux"});
    ref.push({ name: 'Comédie', link: "comedie"});
    ref.push({ name: 'Drame', link: "drame"});
    ref.push({ name: 'Epouvante - Horreur', link: "epouvantehorreur"});
    ref.push({ name: 'Famille', link: "famille"});
    ref.push({ name: 'Fantastique', link: "fantastique"});
    ref.push({ name: 'Fantasy', link: "fantasy"});
    ref.push({ name: 'Horreur', link: "horreur"});
    ref.push({ name: 'Policier', link: "policier"});
    ref.push({ name: 'Science fiction', link: "sciencefiction"});
    ref.push({ name: 'Spectacle', link: "spectacle"});
    ref.push({ name: 'Thriller', link: "thriller"});
    return true;
}

// Get "Genres" list for the sidebar

function getGenres(){
	const ref = firebaseApp.database().ref('genres');
	return ref.once('value').then(snap => snap.val());
}

// Put here ur coinhive information
const secretAPI = 'SECRET API KEY';
const url = 'https://api.coinhive.com/stats/site?secret=' + secretAPI;

const app = express();


const http = require('http').Server(app);
const socket = require('socket.io')(http);

// Where our views are? (default values)
app.set('views', './views');
// let's use ejs which give the hability to use include external code
app.set('view engine', 'ejs');

// Middleware

// Where ou assets are - Didn't work, maybe cuz firebase hosting take over this params
app.use('/static', express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

// Default information
// We really don't need the first two

var coinhive = {
	"hashesPerSecond": 0,
	"hashesTotal": 0,
	"xmrPending": 0,
	"xmrPaid": 0,
}

// Getting periodically some coinhive information
// Need to send them to the client using socket.io

const requestLoop = setInterval(function(){
  request({
      url: url,
      method: "GET",
      timeout: 5000,
      followRedirect: true,
      maxRedirects: 10
  },function(error, response, body){
      if(!error && response.statusCode == 200){
      	let content = JSON.parse(body);
      	coinhive.hashesPerSecond = content.hashesPerSecond;
      	coinhive.hashesTotal = content.hashesTotal;
      	coinhive.xmrPending = Math.floor(content.xmrPending * 100000000) / 100000000;
      	coinhive.xmrPaid =  Math.floor(content.xmrPaid * 100000000) /100000000;

      	//socket.broadcast.emit('notification', coinhive);
      	socket.sockets.emit("myEvent", {
		  somethingToSendToBrowser: "Hello",
		  arrayToSendToBrowser: [
		    "I'm the data that will get sent.",
		    "I'm some more data.",
		    "Here's the third piece of data."
		  ]
		});

      }else{
          console.error('Cannot retrieve coinhive information:' + response.statusCode);
      }
  });
}, 10000);

app.get('/', (request, response) => {

    let genresStatic = [
        { name: 'Action', link: "action"},
        { name: 'Animation', link: "animation"},
        { name: 'Arts Martiaux', link: "artsmartiaux"},
        { name: 'Comédie', link: "comedie"},
        { name: 'Drame', link: "drame"},
        { name: 'Epouvante - Horreur', link: "epouvantehorreur"},
        { name: 'Famille', link: "famille"},
        { name: 'Fantastique', link: "fantastique"},
        { name: 'Fantasy', link: "fantasy"},
        { name: 'Horreur', link: "horreur"},
        { name: 'Policier', link: "policier"},
        { name: 'Science fiction', link: "sciencefiction"},
        { name: 'Spectacle', link: "spectacle"},
        { name: 'Thriller', link: "thriller"}
    ];


    getGenres().then(genres => {
    	if(genres === null){
    		genres = genresStatic;
    	} else {
    		genres = Object.values(genres);
    	}
    	console.log(genres);
		response.set('Cache-control', 'public, max-age=300, s-maxage=600');
		response.render('index', {title:'Streaming World', genres:genres, coinhive:coinhive});	
	});
});

/*
How can we reproduce / mimic relational database with a noSQL database?

https://firebase.googleblog.com/2013/04/denormalizing-your-data-is-normal.html

https://stackoverflow.com/questions/16638660/firebase-data-structure-and-url/16651115#16651115

https://highlyscalable.wordpress.com/2012/03/01/nosql-data-modeling-techniques/

https://firefeed.io/


*/

/*

Searching for a film
use body-parser or delete it!

app.post('/', (request, response) => {

    let genres = [
        { name: 'Action', link: "action"},
        { name: 'Animation', link: "animation"},
        { name: 'Arts Martiaux', link: "artsmartiaux"},
        { name: 'Comédie', link: "comedie"},
        { name: 'Drame', link: "drame"},
        { name: 'Epouvante - Horreur', link: "epouvantehorreur"},
        { name: 'Famille', link: "famille"},
        { name: 'Fantastique', link: "fantastique"},
        { name: 'Fantasy', link: "fantasy"},
        { name: 'Horreur', link: "horreur"},
        { name: 'Policier', link: "policier"},
        { name: 'Science fiction', link: "sciencefiction"},
        { name: 'Spectacle', link: "spectacle"},
        { name: 'Thriller', link: "thriller"}
    ];

	// console.log(request.body);
	response.set('Cache-control', 'public, max-age=300, s-maxage=600');
	response.render('index', {title:'Résultat de la recherche', genres:genres});	
});
*/

 exports.app = functions.https.onRequest(app);
