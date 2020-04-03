const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {Storage} = require('@google-cloud/storage');
const express = require('express');
const engines = require('consolidate');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');
const fs = require('fs');
const serviceAccount = require('./ServiceAccountKey.json');

admin.initializeApp
({
    credential: admin.credential.cert(serviceAccount)
});

const projectId = 'sync-7e5a0.appspot.com'
const keyFilename = './ServiceAccountKey.json'
const storage = new Storage({projectId, keyFilename});

const db = admin.firestore();

const app = express();

//Set engine as pug
app.engine('pug', engines.pug);
//Set view folder location
app.set('views', './views');
//Use new engine
app.set('view engine', 'pug');

//Homepage
app.get('/', (request, response) =>
{
    //Cache request for faster access
    response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    //Render page
    response.render('home');
})

app.get('/feed', (request, response) =>
{
    //Cache request for faster access
    response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    //Render page
    response.render('feed');
})

app.get('/userProfile', (request, response) =>
{
    var data = request.query.id;

    console.log("Retrieving " + data + " info");

    db.collection('Users').doc(data).get()
    .then(doc =>
        {
            if(doc)
            {
                response.send({code: "200", res: doc.data()["picture"]});
            }
            else
            {
                response.send({code: "500", res: "Document not found"});
            }
        })
})

app.post('/register', (request, response) =>
{
    var data = request.body.data;
    var ID = 0;
    var counter = 0;
    var emailHash;
    var IDList = [];
    var uniqueID;

    db.collection('Users').get()
    .then(snapshot =>
        {
            if(snapshot["_size"] != 0)
            {
                snapshot.forEach(doc =>
                {
                    //Add all unique IDs to an array
                    counter++;
                    IDList.push(doc.id);

                    if(counter >= snapshot["_size"])
                    {
                        //Loop through array
                        for(var i = 0; i < IDList.length; i)
                        {
                            //Check if unique ID exists, if so add a new number to the ID
                            if(IDList[i] == (data.username + "#" + ID))
                            {
                                i = 0;
                                ID++;

                                //If ID reaches maximum number of 9999, ask the user to rename it
                                if(ID >= 10000)
                                {
                                    response.send({code:"409", err:"username"});
                                    break;
                                }
                            }
                            else
                            {
                                i++;
                            }
                            if(i+1 >= IDList.length)
                            {
                                bcrypt.compare(data.email, doc.data()["email"], function(err, res) 
                                {
                                    if(!res)
                                    {
                                        bcrypt.genSalt(10, function(err, salt)
                                        {
                                            bcrypt.hash(data["email"], salt, function(err, hash) 
                                            {
                                                emailHash = hash;
                                                bcrypt.genSalt(10, function(err, salt)
                                                {
                                                    bcrypt.hash(data["password"], salt, function(err, hash) 
                                                    {
                                                        var nLength = ID.toString().length;

                                                        switch(nLength)
                                                        {
                                                            case 1:
                                                                uniqueID = data.username + "#000" + ID;
                                                                break;

                                                            case 2:
                                                                uniqueID = data.username + "#00" + ID;
                                                                break;

                                                            case 3:
                                                                uniqueID = data.username + "#0" + ID;
                                                                break;

                                                            default:
                                                                uniqueID = data.username + "#" + ID;
                                                        }

                                                        console.log("Getting random words");

                                                        fetch('https://random-word-api.herokuapp.com/word?number=2')
                                                            .then(res => res.json())
                                                            .then(json =>
                                                            {
                                                                var fields =
                                                                {
                                                                    username: data.username,
                                                                    id: ID,
                                                                    email: emailHash,
                                                                    password: hash,
                                                                    picture: json[0] + "@" + json[1]
                                                                }
                                                                db.collection('Users').doc(uniqueID).set(fields).then(() =>
                                                                {
                                                                    response.send({code: "200", id: uniqueID});
                                                                })
                                                            });
                                                    })
                                                })
                                            })
                                        })
                                    }
                                    else
                                    {
                                        response.send({code: "409", err: "email"});
                                    }
                                })
                            }
                        }
                    }
                })
            }
            else
            {
                bcrypt.genSalt(10, function(err, salt)
                {
                    bcrypt.hash(data["email"], salt, function(err, hash) 
                    {
                        emailHash = hash;
                        bcrypt.genSalt(10, function(err, salt)
                        {
                            bcrypt.hash(data["password"], salt, function(err, hash) 
                            {
                                var nLength = ID.toString().length;
                            
                                switch(nLength)
                                {
                                    case 1:
                                        uniqueID = data.username + "#000" + ID;
                                        break;
                                
                                    case 2:
                                        uniqueID = data.username + "#00" + ID;
                                        break;
                                
                                    case 3:
                                        uniqueID = data.username + "#0" + ID;
                                        break;
                                    
                                    default:
                                        uniqueID = data.username + "#" + ID;
                                }
                            
                                fetch('https://random-word-api.herokuapp.com/word?number=2')
                                    .then(res => res.json())
                                    .then(json =>
                                    {
                                        var fields =
                                        {
                                            username: data.username,
                                            id: ID,
                                            email: emailHash,
                                            password: hash,
                                            picture: json[0] + "@" + json[1]
                                        }
                                        db.collection('Users').doc(uniqueID).set(fields).then(() =>
                                        {
                                            response.send({code: "200", id: uniqueID});
                                        })
                                    });
                            })
                        })
                    })
                })
            }
        })
    .catch(err => 
        {
            response.send({code: "500", err: err});
        });
})

app.post('/login', (request, response) =>
{
    var data = request.body.data;
    var counter = 0;

    db.collection('Users').get()
    .then(snapshot =>
        {
            if(snapshot["_size"] != 0)
            {
                snapshot.forEach(doc =>
                    {
                        bcrypt.compare(data.email, doc.data()["email"], function(err, res) 
                        {
                            if(res)
                            {
                                bcrypt.compare(data.password, doc.data()["password"], function(err, res) 
                                {
                                    if(res)
                                    {
                                        response.send({code: "200", id: doc.id});
                                    }
                                    else
                                    {
                                        counter++;
        
                                        if(counter == snapshot["_size"])
                                        {
                                            response.send({code: "409", err: ""});
                                        }
                                    }
                                })
                            }
                            else
                            {
                                counter++;
        
                                if(counter == snapshot["_size"])
                                {
                                    response.send({code: "409", err: ""});
                                }
                            }
                        })
                    })
            }
            else
            {
                response.send({code: "409", err: ""});
            }
        })
    .catch(err => 
        {
            response.send({code: "500", err: err});
        });
})

async function uploadFile(path)
{
    await storage.bucket("sync-7e5a0.appspot.com").upload(path, 
    {
        gzip: true,
        metadata: 
        {
            cacheControl: 'public, max-age=31536000',
        },
    });
}

//Export app
exports.app = functions.https.onRequest(app);