const express = require('express');
const dotenv = require('dotenv');
const twitter = require("twit")
const NodeGeocoder = require('node-geocoder');


const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser = require("body-parser");


const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');


// NodeGeocoder authentication
const options = {
  provider: 'here',

  // Optional depending on the providers
  httpAdapter: 'https',
  apiKey: 'jO9nYHc--TUTA8dwdtboofJN8coxSRXI4GBpdxAu73I', // for Mapquest, OpenCage, Google Premier
  formatter: null // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options)




dotenv.config({ path: './config/config.env'})

// Connecting to mongodb
mongoose.connect('mongodb://localhost:27017/twit2db', {useNewUrlParser: true,useUnifiedTopology: true});

const Dataschema = new mongoose.Schema({
  keyword: String,
  tweet: String,
  latitude:Number,
  longitude:Number,
  retweet_count:Number
})

const Tweet = mongoose.model('Tweet', Dataschema);

// Twitter api authentication
const T = new twitter({

        consumer_key: "lCwhMzI1C8RnsIoPyBRnCyqX3",
        consumer_secret: "lQM5vbxICIkI8uHcawX1cMlyYeeqJpTo9MAf6itW0JL6Yf4zMO",
        access_token: "1526617248655286272-vrQPqs7ZOiWk6rIvw2ZSfkNSP1khIX",
        access_token_secret: "GOnqyomccHBeV9Nf2NlXMiMpubaBSfIs7PMi35mGKvh0e"
      });



//Homepage route
app.get("/",function(req,res){
  res.sendFile(__dirname+"/index.html")
})



// Tweet route
app.post("/tweet",async function(req,res){

var tweets = []
  var key = req.body.Key;
  var no_of_tweets = req.body.limit;

  let answer = await Tweet.find({keyword:key}, null, {limit: no_of_tweets});

  for(let x of answer){
    tweets.push(x.tweet)
    }


 res.render("tweet",{tweet_list:tweets,Keyword:key})
})



// Geomap route
app.post("/map",async function(req,res){

  var latitude = []
  var longitude =[]


  var key = req.body.Key;
  var no_of_tweets = req.body.limit;

  let answer = await Tweet.find({keyword:key}, null, {limit: no_of_tweets});

  for(let x of answer){
    latitude.push(x.latitude)
    longitude.push(x.longitude)
  }

 res.render("map",{Lat:latitude,Long:longitude})
})


// Linear Chart route
app.post("/chart",async function(req,res){

  var line_points = []

  var key = req.body.Key;
  var no_of_tweets = req.body.limit;

  let answer = await Tweet.find({keyword:key}, null, {limit: no_of_tweets});

  for(let x of answer){
    line_points.push(x.retweet_count)


  }

 res.render("chart",{Line_data:line_points,no_of_tweets:no_of_tweets})
})



// add the data to the database
app.post("/database",function(req,res){

    var location_address = []
    var tweets=[]
    var line_data =[]

    var key = req.body.Key;
    var no_of_tweets = req.body.limit;
    // console.log("ulle")

// fetaching the tweets from twitter based on the keyword and the no. of tweets
    T.get("search/tweets",{q:key,count:no_of_tweets} ,function(err,data,response){


      for (let i = 0; i < no_of_tweets; i++) {
              var location = data.statuses[i]?.user['location']
              var tweet = data.statuses[i]?.text
              var retweet_count =data.statuses[i]?.retweet_count

              location_address.push(location)
              tweets.push(tweet)
              line_data.push(retweet_count)


            }


            location_address = (location_address.filter(x => x));

          location_address.forEach(function(currentValue, index, arr){

            // geocoder converts the address to latitude and longitude
             geocoder.geocode(currentValue,(err,res1)=>{

               // adding a document to the mongodb database
               const add_tweet = new Tweet({keyword:key,tweet:tweets[index],latitude:res1[0]?.latitude,longitude:res1[0]?.longitude,retweet_count:line_data[index]})
               add_tweet.save();



             })
          })


      })
 res.redirect("/");
})


app.listen(3000,function(){

  console.log("server started successfully")
})
