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

    //Variables - Room
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;
    var roomID, roomSyncID;

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
    var intervalID = 0;

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
        leaveRoom();
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
                    db.ref('Rooms/' + data.res + "/Chat/1/").set({name: "Server", message: "Welcome"});
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

        $('joinRoomSubmit').prop('disabled', true);

        var input = $('#roomIDInput').val();

        if(input != "")
        {
            console.log("Not empty");
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
        e.target.setVolume(10);
    }

    var done = false;

    function onPlayerStateChange(event) 
    {
        if (event.data == 1) 
        {
            var sync = setInterval(function()
            {
                var date = new Date();

                console.log(roomSyncID + " | " + id);
                if(roomSyncID == id)
                {
                    console.log("Sync with me");
                    db.ref('Rooms/' + roomID + "/Room/").update({videoTime: Math.trunc(player.getCurrentTime()), timestamp: date.getTime()});
                }
                else
                {
                    console.log("Sync with other");
                    db.ref('Rooms/' + roomID + "/Room/").once('value', function(data)
                    {
                        var videoTime = data.val()["videoTime"] + Math.trunc(((date.getTime() - data.val()["timestamp"]) / 1000));
                        player.seekTo(videoTime);
                    })
                }
            }, 3000)

            intervalID = sync;
        }
        else
        {
            clearInterval(intervalID);
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
        var viewersCount = "<p class='viewersCount' > 1 </p> "

        $('#myRooms').append("<div class='roomTag' name=" + id + "><div>" + roomName + "<div>" + viewersImg + viewersCount + "</div></div></div><hr>");
    }

    function getRoomSyncID(roomID, callback)
    {
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
            callback(Object.keys(data.val())[lowTimestampIndex]);
        })
    }
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
            $('#sidebarToggle').fadeIn("fast");
        });

        $('#content').animate
        ({
            width: "100%",
            marginLeft: "0%"
        }, 600);

        sidebar = false;
    }

    function openSidebar()
    {
        $('#sidebarToggle').fadeOut("fast");
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

        sidebar = true;
    }
})

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