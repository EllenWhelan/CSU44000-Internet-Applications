/*-------------------- JAVASCIPT CODE FOR SERVER-----------------------------------------------*/

/*-------------------------CONSTANTS AND SETUP/CONFIGURATION---------------------------------*/
//requirements
const express = require('express');
const AWS = require("aws-sdk");
//aws credential constants-must be deleted before submission and upload to github
const ACCESS_KEY= ''
const SECRET_KEY = ''
//location of bucket movie data 
const PORT = 3000
const BUCKET_NAME = "csu44000assignment220"
const FILE_NAME="moviedata.json"


/*---------------------code copied from aws tutorial ---------------------------------------
//(https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.html)
*/
//set up parameters of table and bucket
const TABLE_PARAMS={
    TableName :"Movies", 
    KeySchema:[
        {AttributeName: "year", KeyType: "HASH"}, 
        {AttributeName: "title", KeyType: "RANGE"} 
    ], 
    AttributeDefinitions:[
        {AttributeName: "year", AttributeType: "N"}, 
        {AttributeName: "title", AttributeType: "S"}
    ], 
    ProvisionedThroughput:{
        ReadCapacityUnits: 1, 
        WriteCapacityUnits: 1
    }
};
const BUCKET_PARAMS={
    Bucket: BUCKET_NAME, 
    Key: FILE_NAME,
}
//database configuration using credentials 
AWS.config.update({
    region: "us-east-1", 
    accessKeyId: ACCESS_KEY, 
    secretAccessKey: SECRET_KEY
})
//create instances of dynamodb and s3 objects
let dynamoDB = new AWS.DynamoDB(); //dynamoDB
let s3 = new AWS.S3();


const app = express(); //build server using express
app.use(express.static('public')); //serve client html page from public folder 

/*----------Functions to handle button clicks ------------*/
 
//function to create table - function creates table using dynamoDB and populates it using subset of data from bucket
app.get('/createTable', async function (req,res){

    s3.getObject(BUCKET_PARAMS, function (err, data){  //get data from bucket 
        if(err){return res.status(400).json(err);} //return error
        let movieObjects =JSON.parse(data.Body) //parse data

        dynamoDB.createTable(TABLE_PARAMS, async function (err, data){//create table and populate with data from bucket 
            if(err){return res.status(400).json(err)}
            else{
                await pause(5000); //allowing time for initial load of DB
                var documentClient = new AWS.DynamoDB.DocumentClient();
                movieObjects.forEach(function (movie){ //add eahc movie object to new table 
                    var params={
                        TableName: "Movies", 
                        Item: {
                            "year": movie.year,
                            "title": movie.title, 
                            "release_date": movie.info.release_date, 
                            "rank": movie.info.rank
                        }
                    };
                    documentClient.put(params, function(err, data){ //put movie object into table
                        if(err)console.error("Error with adding movie object:", movie.title, JSON.stringify(err, null, 2));
                        else{console.log("Movie object added: ", movie.title);}
                    });  
                });
                console.log("Finished populating table")
                return res.status(200).send("Created table and populated")
            }
        });
    })
})

//function to delete table
app.get('/deleteTable', async function (req, res){
    var params = {
        TableName: "Movies"
    };
    await dynamoDB.deleteTable(params, function(err, data){ //delete table
        if(err){return res.status(400).json(err)}
        else{return res.status(200).send('Table deleted');}
    });
})

//funtion to query table - take user input and search table for matching data
app.get('/getMovies', async function (req, res){
    const {title, year} = req.query
    if(!title||!year){res.status(400).send('Please provide title and year');} //user didn't provide title and year 
    if(!dynamoDB){res.status(400).send("Table doesn't exist");} //havent created table yet - nothing to query

    var documentClient = new AWS.DynamoDB.DocumentClient();
    var params={
        TableName: "Movies", 
        KeyConditionExpression: "#yr = :yyyy and begins_with(title, :t)", //sourced from aws tutorial
        ExpressionAttributeNames:{
            "#yr":"year",
        }, 
        ExpressionAttributeValues:{
            ":yyyy": parseInt(year), 
            ":t": title
        }
    };
    //perform query on table
    documentClient.query(params, function(err, data){
        if(err){
            console.log(err)
            return res.status(400).json(err);
        }else{
            console.log("query succesful");
            var results = []
            data.Items.forEach(function(item){ //add return interms to results array
                console.log(item)
                results.push({
                    "title": item.title, 
                    "year": item.year,
                    "release_date": item.release_date, 
                    "rank": item.rank,
                })
            });
            return res.status(200).json(results);
        }
    });
})

//function to pause program for 5000ms to allow inital load of db 
function pause(ms){
    return new Promise((resolve) => {
        setTimeout(resolve,ms);
    });
}

//run server on port 3000
app.listen(PORT, function (){
    console.log(`Server is running on port ${PORT}`);
});