const { json } = require('body-parser')
const express = require('express')
const app = express()
const port = 3000
const path=require("path")
const fetch = require('node-fetch');
let publicPath= path.resolve(__dirname,"public")

app.use(express.static(publicPath))
app.get('/forecast/:city', findWeather)
app.listen(port, () => console.log(`Example app listening on port ${port}!`))


//make call to openweather API 
function findWeather(req, res) {
    let city = req.params.city; //parse city from parameters 
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&APPID=3e2d927d4f28b456c6bc662f34350957`) //gets five day forecast of city 
    .then(res => res.json()) //waiting for response then converting it to json object
    .then(json => {  //waiting for previous then and then printing it out and returning it to client
        console.log(json);
        let result=json;
        res.send(result); //returning json object to client
    })

}