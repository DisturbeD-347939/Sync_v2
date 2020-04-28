const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {Storage} = require('@google-cloud/storage');
const express = require('express');
const app = express();
const engines = require('consolidate');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');
const serviceAccount = require('./ServiceAccountKey.json');
const projectId = 'sync-7e5a0.appspot.com'
const keyFilename = './ServiceAccountKey.json'
const storage = new Storage({projectId, keyFilename});

admin.initializeApp
({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


//Set engine as pug
app.engine('pug', engines.pug);
//Set view folder location
app.set('views', './views');
//Use new engine
app.set('view engine', 'pug');

/******************************************* GET ******************************************/

//Homepage
app.get('/', (request, response) =>
{
    //Cache request for faster access
    response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    //Render page
    response.render('homepage');
})

app.get('/home', (request, response) =>
{
    //Cache request for faster access
    response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    //Render page
    response.render('home');
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

app.get('/getRooms', (request, response) =>
{
    var data = request.query.id;
    var counterRooms = 0;
    var roomsSize = 0;
    var usersSize = 0;
    var roomsJoined = 0;
    var roomIDs = [];

    db.collection('Rooms').get()
    .then(snapshot =>
    {
        roomsSize = snapshot["_size"];
        if(snapshot["_size"] > 0)
        {
            snapshot.forEach(doc =>
            {
                var roomID = doc.id;
                var roomName = doc.data()["roomName"];

                db.collection('Rooms').doc(doc.id).collection("Users").get()
                .then(snapshot =>
                {
                    var counterUsers = 0;
                    usersSize = snapshot["_size"];
                    snapshot.forEach(doc =>
                    {
                        counterUsers++;
                        console.log(doc.id == data);
                        if(doc.id == data)
                        {
                            roomIDs[roomsJoined] =
                            {
                                id: roomID,
                                name: roomName
                            }
                            roomsJoined++;
                        }

                        if(counterUsers >= usersSize)
                        {
                            counterRooms++;
                        }

                        console.log(counterRooms + " | " + roomsSize + " | " + counterUsers + " | " + usersSize)
                        if(counterRooms >= roomsSize && counterUsers >= usersSize)
                        {
                            console.log("sent");
                            response.send({code: "200", res: roomIDs});
                        }
                    })
                })
                .catch(err => 
                {
                    console.log(err);
                    response.send({code: "500", err: err});
                });
            })
        }
        else
        {
            console.log("Sent 2");
            response.send({code: "200", res: roomIDs})
        }
    })
    .catch(err => 
    {
        response.send({code: "500", err: err});
    });
})

app.get('/getRoomInfo', (request, response) =>
{
    var id = request.query.roomID;
    var password = request.query.roomPassword;
    var userID = request.query.userID;

    db.collection('Rooms').get()
    .then(snapshot =>
    {
        if(snapshot["_size"] != 0)
        {
            var counter = 0;
            snapshot.forEach(doc =>
            {
                if(doc.id == id)
                {
                    db.collection('Rooms').doc(id).get()
                    .then(doc =>
                    {   
                        if(doc.data()["roomPassword"] == password)
                        {
                            db.collection('Rooms').doc(id).collection('Users').doc(userID).set({role: "member"})
                            response.send({code: "200", roomName: doc.data()["roomName"]});
                        }
                        else
                        {
                            response.send({code: "401"})
                        }
                    })
                }
                else
                {
                    counter++;
                }

                if(counter >= snapshot["_size"])
                {
                    response.send({code: "204"})
                }
            })
        }
        else
        {
            response.send({code: "204"});
        }
    })
})

/******************************************* POST ******************************************/

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

app.post('/createRoom', (request, response) =>
{
    var data = request.body.data;
    var id = request.body.id;
    var roomID;

    db.collection('Rooms').get()
    .then(snapshot =>
        {
            if(data["roomPassword"] != "")
            {
                bcrypt.genSalt(10, function(err, salt)
                {
                    bcrypt.hash(data["roomPassword"], salt, function(err, hash) 
                    {
                        data["roomPassword"] = hash;
                        db.collection('Rooms').add(data).then(doc => 
                        {
                            roomID = doc.id;
                            db.collection('Rooms').doc(doc.id).collection("Users").doc(id).set({test: "test"})
                            .then(doc =>
                                {
                                    response.send({code:"200", res: roomID});
                                })
                        });
                    });
                });
            }
            else
            {
                db.collection('Rooms').add(data).then(doc => 
                {
                    roomID = doc.id;
                    db.collection('Rooms').doc(doc.id).collection("Users").doc(id).set({role: "admin"})
                    .then(doc =>
                    {
                        response.send({code:"200", res: roomID});
                    })
                });
            }
        })
    .catch(err =>
        {
            response.send({code:"500", err: err});
        })
})

/***************************************** SOCKETS ***************************************/

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