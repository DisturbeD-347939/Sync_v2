var id = getCookie('username');

if(!getCookie("username"))
{
    window.location.href = "/";
}

$(document).ready(function()
{
    /***************************** SETUP *********************************/
    //Variables - Firebase : Database
    var firebaseConfig = 
    {
        apiKey: "AIzaSyBxckf9wrJVmLSI4kMGnDjZmCPqpyE-8Pk",
        authDomain: "sync-7e5a0.firebaseapp.com",
        databaseURL: "https://sync-7e5a0.firebaseio.com",
        projectId: "sync-7e5a0",
        storageBucket: "sync-7e5a0.appspot.com",
        messagingSenderId: "799635030891",
        appId: "1:799635030891:web:d7a9b39c19e178258b422e",
        measurementId: "G-58PCG0EDDL"
    };
    firebase.initializeApp(firebaseConfig);
    var db = firebase.database();

    //Variables - Sidebar
    var sidebar = true;
    $('#sidebarToggle').css('left', $('#sidebar').width());

    //Variables - Youtube Player API
    var player;
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    //Variables - Room
    var joinedRoomID, synchronize, syncMe, firstPlay, videoTime;

    //Positioning/Sizing - Logo : Tag
    $('#usernameDisplay').text(getCookie("username"));
    $('#logo').height($('#logoDisplay').height());

    //Positioning/Sizing - Log Out
    var logOutTop = ($('#logOut').position()).top = $('#sidebar').height() - $('#logOut').height();
    $('#logOut').css('top', logOutTop);
    $('#logOut').css('width', $('#sidebar').width());

    //Positioning/Sizing - Create room form
    $('#createRoomImg').width($('#createRoom').width() + 20);
    $('#createRoomImg').height($('#createRoom').height() + 20);
    var createRoomImgTop = $('#createRoom').position().top;
    var createRoomImgLeft = $('#createRoom').position().left;
    $('#createRoomImg').css({'top': createRoomImgTop, 'left': createRoomImgLeft});

    //Player change
    

    //Animations
    var createRoomAnimation = false;
    var joinRoomAnimation = false;
    var roomAnimation = false;
    var initialScreenAnimation = false;

    //Hiding
    $('#createRoomForm :nth-child(3)').hide();
    $('#createRoom').hide();
    $('#joinRoom').hide();
    $('#room').hide();

    /****************************** EVENTS *********************************/

    //Window events
    window.onresize = function()
    {
        //Positioning/Sizing - Logo : Tag
        $('#logo').height($('#logoDisplay').height());

        //Positioning/Sizing - Log Out
        var logOutTop = ($('#logOut').position()).top = $('#sidebar').height() - $('#logOut').height();
        $('#logOut').css('top', logOutTop);
        $('#logOut').css('width', $('#sidebar').width());

        //Positioning/Sizing - Sidebar
        $('#sidebarToggle').css('left', $('#sidebar').width());
    }

    window.onbeforeunload = function()
    {
        leaveRoom(joinedRoomID);
        return null;
    }

    //Clicks
    $('#logOut').click(function()
    {
        setCookie('username', "", -1);
        window.location.href = '/';
    })

    $('#createRoomBtn').click(function()
    {
        $('#joinRoom').fadeOut("fast", function()
        {
            joinRoomAnimation = true;
            check();
        });

        $('#room').fadeOut("fast", function()
        {
            roomAnimation = true;
            check();
        });

        $('#initialScreen').fadeOut("fast", function()
        {
            initialScreenAnimation = true;
            check();
        });

        function check()
        {
            if(joinRoomAnimation && roomAnimation && initialScreenAnimation)
            {
                joinRoomAnimation = false;
                roomAnimation = false;
                initialScreenAnimation = false;

                $('#createRoom').fadeIn("fast");
            }
        }
    })

    $('#createRoomSubmit').click(function()
    {
        $('#createRoomForm').submit();
    })

    $('#joinRoomSubmit').click(function()
    {
        $('#joinRoomForm').submit();
    })

    $('#sidebarToggle').click(function()
    {
        sidebarToggle();
    })

    $(document).on('click','.roomTag',function()
    {
        joinRoom($(this).attr('name'));
    })

    $('#joinRoomBtn').click(function()
    {
        $('#createRoom').fadeOut("fast", function()
        {
            createRoomAnimation = true;
            check();
        })

        $('#room').fadeOut("fast", function()
        {
            roomAnimation = true;
            check();
        })

        $('#initialScreen').fadeOut("fast", function()
        {
            initialScreenAnimation = true;
            check();
        })

        function check()
        {
            if(createRoomAnimation && roomAnimation && initialScreenAnimation)
            {
                createRoomAnimation = false;
                roomAnimation = false;
                initialScreenAnimation = false;

                $('#joinRoom').fadeIn("fast");
            }
        }
    })

    $('#leaveRoom').click(function()
    {
        leaveRoom();
    })

    //On change
    $('#privacyRoomSwitch > label :checkbox').change(function()
    {
        if(this.checked)
        {
            $('#createRoomForm :nth-child(3)').show();
           //$('#createRoomForm :nth-child(2)').css("margin-bottom", "0px");
        }
        else
        {
            $('#createRoomForm :nth-child(3)').hide()
            $('#createRoomForm :nth-child(3) > input').val("");
            $('#createRoomForm :nth-child(3) > input').removeClass("invalid");
            $('#createRoomForm :nth-child(3) > input').removeClass("valid");
            //$('#createRoomForm :nth-child(2)').css("margin-bottom", "20px");
        }
    })

    /****************************** REQUESTS *********************************/

    $.get('/getRooms',
    {
        id: id
    },
    function(data, status)
    {
        if(data.code == "200")
        {
            data.res.forEach(room =>
            {
                addRoom(room.name, room.id);
            })
        }
    })

    $.get('/userProfile',
    {
        id: id
    },
    function(data, status)
    {
        if(data.code == "200")
        {
            $('#profilePicture').attr('src', 'https://api.adorable.io/avatars/200/' + data.res + '.png');
        }
    })

    $('#createRoomForm').submit(function(e)
    {
        e.preventDefault();

        $('createRoomSubmit').prop('disabled', true);

        var valid = true;
        var inputs = $('#createRoomForm :input');
        var values = {};

        inputs.each(function()
        {
            if($(this).parent().css("display") != "none" && this.type != "checkbox")
            {
                values[this.name] = $(this).val();
                if(!$(this).hasClass("valid")) { valid = false; }
            }

            if(this.name == "privacyEnable" && !$(this).prop('checked'))
            {
                values["roomPassword"] = "";
            }
        })

        if(valid)
        {
            values["owner"] = id;

            $.post('/createRoom',
            {
                data: values,
                id: id
            },
            function(data, status)
            {
                var date = new Date();
                if(data.code == "200")
                {
                    //db.ref('Rooms/' + data.res + "/Chat/1/").set({name: "Server", message: "Welcome"});
                    db.ref('Rooms/' + data.res + "/Room/").set({videoID: "aQS7Py1Fx0s", videoTime: "0", timestamp: date.getTime(), userCount: "0"});
                    addRoom(values["roomName"], data.res);
                    closeSidebar();
                    joinRoom(data.res);
                }
                else
                {
                    $('createRoomSubmit').prop('disabled', false);
                }
            })
        }
    })

    $('#joinRoomForm').submit(function(e)
    {
        e.preventDefault();

        //console.log(("#joinRoomSubmit").prop('disabled', true));
        $("#joinRoomSubmit").attr('disabled','disabled');

        var roomJoinIDInput = $('#roomJoinIDInput').val();
        var roomJoinPasswordInput = $('#roomJoinPasswordInput').val();

        if(roomJoinIDInput != "")
        {
            $.get('./getRoomInfo',
            {
                roomID: roomJoinIDInput,
                roomPassword: roomJoinPasswordInput,
                userID: id
            },
            function(data, status)
            {
                if(data["code"] == "204")
                {
                    $('#joinRoomForm > div:first-child > span').attr("data-error", "Room doesn't exist");
                    $('#joinRoomForm > div:first-child > input').removeClass("valid");
                    $('#joinRoomForm > div:first-child > input').addClass("invalid");
                    M.updateTextFields();
                    setTimeout(function()
                    {
                        $('#joinRoomForm > div:first-child > span').attr("data-error", "");
                        $('#joinRoomForm > div:first-child > input').removeClass("invalid");
                        M.updateTextFields();
                        $("#joinRoomSubmit").removeAttr('disabled');
                    }, 2500)
                    
                }
                else if(data["code"] == "401")
                {
                    $('#joinRoomForm > div:last-child > span').attr("data-error", "Wrong password");
                    $('#joinRoomForm > div:last-child > input').removeClass("valid");
                    $('#joinRoomForm > div:last-child > input').addClass("invalid");
                    M.updateTextFields();
                    setTimeout(function()
                    {
                        $('#joinRoomForm > div:last-child > span').attr("data-error", "");
                        $('#joinRoomForm > div:last-child > input').removeClass("invalid");
                        M.updateTextFields();
                        $("#joinRoomSubmit").removeAttr('disabled');
                    }, 2500)
                    
                }
            })
        }
        else
        {
            $('#joinRoomForm > div > input').addClass("invalid");
        }
    })

    /****************************** FUNCTIONS **********************************/

    window.onYouTubePlayerAPIReady = function() 
    {
        player = new YT.Player('player', 
        {
            height: '100%',
            width: '100%',
            videoId: 'leOP7rWwBpw',
            playerVars:
            {
                'autoplay': 0,
                'controls': 1
            },
            events: 
            {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }

    function onPlayerReady(e) 
    {
        console.log("Video ready");
        e.target.setVolume(0);
    }

    function masterSynchronize(bool)
    {
        if(bool)
        {
            if(syncMe)
            {
                synchronize = setInterval(function()
                {
                    db.ref('Rooms/' + joinedRoomID + "/Room/").update({videoTime: Math.trunc(player.getCurrentTime()), timestamp: + new Date()});
                },2500)
            }
            else 
            {
                if(firstPlay)
                {
                    db.ref('Rooms/' + joinedRoomID + "/Room/").once('value').then(function(data) 
                    {
                        videoTime = data.val()["videoTime"];
                        player.seekTo(videoTime);
                    })
                    firstPlay = false;
                }
            }
        }
        else
        {
            clearInterval(synchronize);
        }
    }

    function onPlayerStateChange(event) 
    {
        if(event.data == 1)
        {
            masterSynchronize(true);
        }
        else
        {
            masterSynchronize(false);
        }
    }

    function stopVideo() 
    {
        player.stopVideo();
    }

    function addRoom(name, id)
    {
        var roomName = "<p class='roomName'>" + name + "</p>";
        var viewersImg = "<i class='viewersImg material-icons small prefix disable-select'> visibility </i>";
        var viewersCount = "<p class='viewersCount' > 0 </p> "    

        $('#myRooms').append("<div class='roomTag' name=" + id + " id=" + id + "><div>" + roomName + "<div>" + viewersCount + viewersImg + "</div></div></div><hr>");

        db.ref('Rooms/' + id + "/Room/Users").on('value', function(snapshot)
        {
            if(snapshot.val())
            {
                $('#myRooms > #' + id + ' > div > div > p').text(Object.keys(snapshot.val()).length);
            }
        })
    }

    function joinRoom(roomID)
    {
        sidebarToggle();
        $('#myRooms > #' + roomID).css('background-color', "#35364a");

        if(joinedRoomID)
        {
            leaveRoom(joinedRoomID);
        }

        joinedRoomID = roomID;

        db.ref('Rooms/' + roomID + "/Room/").once('value').then(function(data) 
        {
            var userID = id.replace('#', "");

            removeChar(userID, "#", function(userID)
            {
                db.ref('Rooms/' + roomID + "/Room/Users/" + userID + "/").set({joined: + new Date()});
            })

            videoTime = data.val()["videoTime"];
            player.loadVideoById(data.val()["videoID"]);

            db.ref('Rooms/' + roomID + "/Room/Users/").once('value').then(function(data)
            { 
                var lowTimestampIndex = 0;
                var lowTimestamp = data.val()[Object.keys(data.val())[lowTimestampIndex]]["joined"];
                
                for(var i = 0; i < Object.keys(data.val()).length; i++)
                {
                    if(lowTimestamp > data.val()[Object.keys(data.val())[i]]["joined"])
                    {
                        lowTimestamp = data.val()[Object.keys(data.val())[i]]["joined"];
                        lowTimestampIndex = i;
                    }
                }

                addChar(Object.keys(data.val())[lowTimestampIndex], "#", Object.keys(data.val())[lowTimestampIndex].length-4, function(data)
                {
                    if(data == id)
                    {
                        syncMe = true;
                    }
                    else
                    {
                        syncMe = false;
                    }
                })
    
            })

            setTimeout(function()
            {
                player.seekTo(videoTime);
                firstPlay = true;
            }, 1000);

            //Welcome message
            $('#messages').append("<div class='server'><p class='nameTag'>" + "Server" + "</p><hr><p class='message'>" + "Welcome to " + $('#myRooms > #' + roomID + ' > div > p').html() + "</p></div>");

            updateChat();
            checkForNewChats();
        })

        //Animations
        $('#createRoom').fadeOut("fast", function()
        {
            createRoomAnimation = true;
            check();
        })

        $('#joinRoom').fadeOut("fast", function()
        {
            joinRoomAnimation = true;
            check();
        })

        $('#initialScreen').fadeOut("fast", function()
        {
            initialScreenAnimation = true;
            check();
        })

        function check()
        {
            if(createRoomAnimation && joinRoomAnimation && initialScreenAnimation)
            {
                createRoomAnimation = false;
                joinRoomAnimation = false;
                initialScreenAnimation = false;

                $('#room').fadeIn("fast");
            }
        }
    }

    function checkForNewChats()
    {
        db.ref('Rooms/' + joinedRoomID + '/Chat/').on('value', function(data)
        {
            updateChat();
        })
    }

    function updateChat()
    {
        db.ref('Rooms/' + joinedRoomID + "/Chat/").once('value').then(function(data) 
        {
            if(data.val())
            {
                for(var i = 0; i < data.val().length; i++)
                {
                    if(data.val()[i])
                    {
                        if(data.val()[i]["name"] == id)
                        {
                            $('#messages').append("<div class='mine'><p class='message'>" + data.val()[i]["message"] + "</p></div>")
                        }
                        else
                        {
                            $('#messages').append("<div><p class='nameTag'>" + data.val()[i]["name"] + "</p><p class='message'>" + data.val()[i]["message"] + "</p></div>");
                        }
                    }
                }
            }
        })
    }

    function leaveRoom(room)
    {
        removeChar(id, "#", function(userID)
        {
            db.ref('Rooms/' + room + "/Room/Users/" + userID).remove();
        })
    }

    function sidebarToggle()
    {
        if(sidebar)
        {
            closeSidebar();
        }
        else
        {
            openSidebar();
        }
    }

    function closeSidebar()
    {
        $('#sidebar').animate
        ({
            left: "-" + $('#sidebar').width(),
        }, 600, function()
        {
            $('#sidebar').hide();
        });

        $('#content').animate
        ({
            width: "100%",
            marginLeft: "0%"
        }, 600);

        $('#sidebarToggle').animate
        ({
            left: "0px"
        }, 600)

        sidebar = false;
    }

    function openSidebar()
    {
        $('#sidebar').show();
        $('#sidebar').animate
        ({
            left: 0
        }, 600);

        $('#content').animate
        ({
            width: "85%",
            marginLeft: "14%"
        }, 600);

        $('#sidebarToggle').animate
        ({
            left: $('#sidebar').width()
        }, 600)

        sidebar = true;
    }

    /************************************ CHAT ***********************************/
    $('#sendMessageBtn').click(function()
    {
        if($('#sendMessageInput').val())
        {
            db.ref('Rooms/' + joinedRoomID + "/Chat/").once('value').then(function(data) 
            {
                console.log(data.val());
                if(data.val())
                {
                    db.ref('Rooms/' + joinedRoomID + "/Chat/" + data.val().length + "/").set({name: id, message: $('#sendMessageInput').val()});
                    $('#sendMessageInput').val("");
                }
                else
                {
                    console.log($('#sendMessageInput').val());
                    db.ref('Rooms/' + joinedRoomID + "/Chat/0/").set({name: id, message: $('#sendMessageInput').val()});
                    $('#sendMessageInput').val("");
                }
            })
        }
    })
})

function removeChar(id, char, callback)
{
    callback(id.replace(char, ""))
}

function addChar(id, char, index, callback)
{
    callback(id.slice(0, index) + char + id.slice(index))
}

function getCookie(cname) 
{
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) 
    {
        var c = ca[i];
        while (c.charAt(0) == ' ') 
        {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) 
        {
          return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays) 
{
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}