const express = require('express');
const dotenv = require('dotenv');
const twitter = require("twit")
const NodeGeocoder = require('node-geocoder');


const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser = require("body-parser");

mongoose.connect('mongodb://localhost:27017/DBZ_db', {useNewUrlParser: true,useUnifiedTopology: true});

const Dataschema = new mongoose.Schema({
  Keyword: String,
  Tweet: String,
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Tweet = mongoose.model('Tweet', Dataschema);




const options = {
  provider: 'here',

  // Optional depending on the providers
  httpAdapter: 'https',
  apiKey: 'jO9nYHc--TUTA8dwdtboofJN8coxSRXI4GBpdxAu73I', // for Mapquest, OpenCage, Google Premier
  formatter: null // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options)


const app = express();

dotenv.config({ path: './config/config.env'})

const T = new twitter({

        consumer_key: "lCwhMzI1C8RnsIoPyBRnCyqX3",
        consumer_secret: "lQM5vbxICIkI8uHcawX1cMlyYeeqJpTo9MAf6itW0JL6Yf4zMO",
        access_token: "1526617248655286272-vrQPqs7ZOiWk6rIvw2ZSfkNSP1khIX",
        access_token_secret: "GOnqyomccHBeV9Nf2NlXMiMpubaBSfIs7PMi35mGKvh0e"
      });



var latitude = []
var longitude =[]


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');


app.get("/geo",function(req,res){
  res.sendFile(__dirname+"/public/home.html")
})

app.get("/",function(req,res){
  res.sendFile(__dirname+"/index.html")
})
var tweets = []
// post to display the tweets
app.post("/tweet",function(req,res){




  var key = req.body.Key;
  var no_of_tweets = req.body.limit;

  T.get("search/tweets",{q:key,count:no_of_tweets} ,function(err,data,response){

    for (let i = 0; i < no_of_tweets; i++) {

            var tweet = data.statuses[i]?.text



            tweets.push(tweet)
          }


          console.log(tweets)



    })

 res.render("tweet",{tweet_list:tweets,Keyword:key})
})


//Geomap for the user locations
app.post("/map",function(req,res){

  var location_address = []
  var tweets = []
  var key = req.body.Key;
  var no_of_tweets = req.body.limit;

 // geocoder.geocode('Chennai,India',(err,res1)=> console.log(res1[0]?.latitude,res1[0]?.longitude))




  T.get("search/tweets",{q:key,count:no_of_tweets} ,function(err,data,response){

    for (let i = 0; i < no_of_tweets; i++) {
            var location = data.statuses[i]?.user['location']
            var tweet = data.statuses[i]?.text


            location_address.push(location)
            tweets.push(tweet)
          }

          location_address = (location_address.filter(x => x));

        location_address.forEach(function(currentValue, index, arr){
           geocoder.geocode(currentValue,(err,res1)=>{
             // console.log(res1[0]?.latitude,res1[0]?.longitude)
             latitude.push(res1[0]?.latitude);
             longitude.push(res1[0]?.longitude);

           })
        })
        // console.log(latitude,longitude)

    })

 res.render("map",{Lat:latitude,Long:longitude})
})

















app.listen(3000,function(){

  console.log("server started successfully")
})
