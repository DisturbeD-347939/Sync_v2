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

    //Room controls
    var checkVideoTime;
    $('#controlSlider').css('top', $('#controlSlider').position().top - $('#controlSlider').height()/2 - 3);
    $('#volumeRangeField > input').attr('value', "0")

    //Room controls - Hiding elements
    $('#controlSlider').css('opacity', '0');
    $('#volumeRangeField').hide();

    //Animations
    var createRoomAnimation = false;
    var joinRoomAnimation = false;
    var roomAnimation = false;
    var initialScreenAnimation = false;

    //Hiding
    $('#createRoomForm :nth-child(3)').hide();
    $('#createRoom, #joinRoom, #room, #roomDetails').hide();

    /****************************** WINDOW *********************************/

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
        //Leave the room when leaving the website
        leaveRoom(joinedRoomID);
        return null;
    }

    /****************************** REQUESTS *********************************/

    //Pull all rooms joined by this user
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

    //Get users profile (only profile picture available atm)
    $.get('/userProfile',
    {
        id: id
    },
    function(data, status)
    {
        if(data.code == "200")
        {
            //Display the profile image provided by the adorable.io API
            $('#profilePicture').attr('src', 'https://api.adorable.io/avatars/200/' + data.res + '.png');
        }
    })

    /****************************** YOUTUBE PLAYER **********************************/

    //On youtube player ready, define variables and run functions
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
                'controls': 0
            },
            events: 
            {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }

    //Once the player is ready turn the volume to 0
    function onPlayerReady(e) 
    {
        e.target.setVolume(0);
        $('#volumeControl').text("volume_mute")
    }

    //Check if the user is playing/pausing the video and update the database accordingly
    function onPlayerStateChange(event) 
    {
        if(event.data == 1)
        {
            masterSynchronize(true);
            $('#controls > #playPause').text("pause");

            db.ref('Rooms/' + joinedRoomID + "/Room/").update({playStatus: "1"});
        }
        else
        {
            masterSynchronize(false);
            $('#controls > #playPause').text("play_arrow");
        }

        if(event.data == 2)
        {
            db.ref('Rooms/' + joinedRoomID + "/Room/").update({playStatus: "2"});
        }
    }

    //Not being used atm but it's a function to stop the video (stop != pause)
    function stopVideo() 
    {
        player.stopVideo();
    }

    /****************************** VIDEO CONTROLS **********************************/

    var playTimeHover = false,
        controlSliderHover = false,
        controlSliderInitialLeft = 0,
        boolControlSliderInitialLeft = false,
        isClicked = false;

    //On play/pause click, play or pause the video and update the database
    $('#playPause').click(function()
    {
        if($('#playPause').text() == "pause")
        {
            player.pauseVideo();
            db.ref('Rooms/' + joinedRoomID + "/Room/").update({playStatus: "2"});
        }
        else
        {
            player.playVideo();
            db.ref('Rooms/' + joinedRoomID + "/Room/").update({playStatus: "1"});
        }
    })

    //Make video time slider draggable on the x axis
    $('#controlSlider').draggable
    ({
        axis: "x",
        containment: 'parent'
    });

    //Detect when the user clicks on the video time slider
    $('#controlSlider').mousedown(function()
    {
        isDraggingControlSlider = false;
        isClicked = true;
    }) 

    //Detect when the user is moving the mouse on the video time slider
    $('#controlSlider').mousemove(function()
    {
        //If the user is also clicking on it then move the slider along with the mouse and show popup timer
        if(isClicked)
        {
            clearInterval(checkVideoTime);
            $('#popupTimer').show();

            var sliderPercentage = (($('#controlSlider').position().left - controlSliderInitialLeft) * 100) / $('#playTime').width();
            var seekToThis = (sliderPercentage * player.getDuration()) / 100;
            var popupTimerSeconds = Math.trunc(seekToThis%60);

            if(popupTimerSeconds < 10)
            {
                popupTimerSeconds = "0" + popupTimerSeconds;
            }

            $('#popupTimer').text(Math.trunc(seekToThis/60) + ":" + popupTimerSeconds);
            $('.determinate').width(sliderPercentage + 0.5 + "%");
        }
    })

    //When the user stops clicking on the slider, update the time of the video locally and send it to the server as well
    $('#controlSlider').mouseup(function()
    {
        $('#popupTimer').hide();
        isClicked = false;

        var sliderPercentage = (($('#controlSlider').position().left - controlSliderInitialLeft) * 100) / $('#playTime').width();
        var seekToThis = (sliderPercentage * player.getDuration()) / 100;

        player.seekTo(seekToThis);

        startControls();

        db.ref('Rooms/' + joinedRoomID + "/Room/").update({videoTime: Math.trunc(seekToThis), timestamp: + new Date(), playStatus: "3"});
    })

    //Animate the sound slider
    $('#volumeControl, #volumeRangeField').hover(
    function()
    {
        $('#volumeRangeField').show();
        $('#volumeRangeField').animate({width: '100px'}, 250);
    },
    function()
    {   
        setTimeout(checkIfOutsideVolumeControl, 1000);
    })

    //If outside the volume slider, close the slider again
    function checkIfOutsideVolumeControl()
    {
        if($('#volumeControl:hover, #volumeRangeField:hover').length == 0)
        {
            $('#volumeRangeField').animate({width: '0px'}, 250, function()
            {
                $('#volumeRangeField').hide();
            });
        } 
    }

    //Change volume of the video and update the icon accordingly 
    $('#volumeRangeField > input').on('input', function()
    {
        player.setVolume($('#volumeRangeField > input').val());

        if($('#volumeRangeField > input').val() == 0)
        {
            $('#volumeControl').text("volume_mute");
        }
        else if($('#volumeRangeField > input').val() < 50)
        {
            $('#volumeControl').text("volume_down");
        }
        else if($('#volumeRangeField > input').val() >= 50)
        {
            $('#volumeControl').text("volume_up");
        }
    })

    //Check if user is hovering the time slider
    $('#playTime > .progress').hover(
    function()
    {
        playTimeHover = true;
        hoverCheck();
    },
    function()
    {
        playTimeHover = false;
        hoverCheck();
    })

    //Check if user has his mouse over the control slider "circle"
    $('#controlSlider').hover(
    function()
    {
        controlSliderHover = true;
        hoverCheck();
    },
    function()
    {
        controlSliderHover = false;
        hoverCheck();
    })

    function hoverCheck()
    {
        //If the user has his mouse over either the time slider bar or the "circle" that controls the time then show the "circle" to control the time
        if(controlSliderHover || playTimeHover)
        {
            $('#controlSlider').css('opacity', '1');
            $('.progress').css('padding', '4px 0px');
        }
        else
        {
            $('#controlSlider').css('opacity', '0');
            $('.progress').css('padding', '2px 0px');
        }
    }

    //Start video controls
    function startControls()
    {
        //Update UI every second
        checkVideoTime = setInterval(function()
        {
            //Define the initial left of the control slider
            if(!boolControlSliderInitialLeft)
            {
                controlSliderInitialLeft = $('#controlSlider').position().left;

                if(controlSliderInitialLeft != 0)
                {
                    boolControlSliderInitialLeft = true;
                }
            } 

            //Parse both the current playtime and the full duration playtime and adjust the numbers to look right on the UI
            var parseCurrentPlayTime = Math.trunc(player.getCurrentTime());
            var parseCurrentPlayTimeSeconds = Math.trunc(parseCurrentPlayTime%60);

            //Makes a number look like 2:03 instead of 2:3
            if(parseCurrentPlayTimeSeconds < 10)
            {
                parseCurrentPlayTimeSeconds = "0" + parseCurrentPlayTimeSeconds;
            }

            var totalPlayTime = Math.trunc(player.getDuration());
            var totalPlayTimeSeconds = Math.trunc(player.getDuration()%60);

            if(totalPlayTimeSeconds < 10)
            {
                totalPlayTimeSeconds = "0" + totalPlayTimeSeconds;
            }

            //Update playtime values
            $('#playTimeNumbers').text(Math.trunc(parseCurrentPlayTime/60) + ":" + parseCurrentPlayTimeSeconds + " / " + Math.trunc(totalPlayTime/60) + ":" + totalPlayTimeSeconds);

            //Get percentage of video done to carry on to the slider
            var videoPlayPercentage = ( Math.trunc(player.getCurrentTime()) * 100) / Math.trunc(player.getDuration());
            $('.determinate').width(videoPlayPercentage + "%");

            //Make the control for the slider follow the slider
            if(sidebar)
            {
                $('#controlSlider').css('left', 60 + $('.determinate').width() - 2 + 280);
            }
            else
            {
                $('#controlSlider').css('left', controlSliderInitialLeft + $('.determinate').width() - 2);
            }

            
        }, 1000)
    }

    //Check for any database updates
    function checkStatus(roomID)
    {
        db.ref('Rooms/' + roomID + "/Room/playStatus").on('value', function(snapshot)
        {
            //If it gets a 1 it means the video is currently playing in the room
            if(snapshot.val() == 1)
            {
                player.playVideo();
            }
            //A 2 means the video is paused in the room
            else if(snapshot.val() == 2)
            {
                player.pauseVideo();
            }
            //A 3 means someone changed the current play time of the video
            else if(snapshot.val() == 3)
            {
                db.ref('Rooms/' + roomID + "/Room/videoTime").once('value', function(snapshot)
                {
                    player.seekTo(snapshot.val());
                })
            }
            //A 4 means someone changed the video in the room
            else if(snapshot.val() == 4)
            {
                db.ref('Rooms/' + roomID + "/Room/videoID").once('value', function(snapshot)
                {
                    player.loadVideoById(snapshot.val());
                    db.ref('Rooms/' + roomID + "/Room/videoTime").once('value', function(snapshot)
                    {
                        player.seekTo(snapshot.val());
                    })
                })
            }
        })
    }

    /************************************ SIDEBAR ***********************************/

    //On click toggle the sidebar on/off
    $('#sidebarToggle').click(function()
    {
        sidebarToggle();
    })

    //On room click, join room
    $(document).on('click','.roomTag',function()
    {
        joinRoom($(this).attr('name'), $(this).children('div').children('p').text());
    })

    //Delete cookie and send user to the main page
    $('#logOut').click(function()
    {
        setCookie('username', "", -1);
        window.location.href = '/';
    })

    //If the user clicks to leave the room, remove the user from this room
    $(document).on('click','#leaveRoom',function()
    {
        leaveRoom($(this).attr('name'));
        $(this).remove();
    })

    //Sidebar toggle function
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

    //Animate closing the sidebar
    function closeSidebar()
    {
        $('#sidebarToggle').text("menu");
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

    //Animate opening the sidebar
    function openSidebar()
    {
        $('#sidebarToggle').text("menu_open");
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

    /************************************ ROOMS ***********************************/

    //On join room click, hide all screens and when hidden, display the join room screen
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

    //On create room btn click, hide all "tabs" and display create room "tab"
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

    //On create room submit, submit the form
    $('#createRoomSubmit').click(function()
    {
        $('#createRoomForm').submit();
    })

    //On join room submit, submit the form
    $('#joinRoomSubmit').click(function()
    {
        $('#joinRoomForm').submit();
    })

    //On copy id click, copy the id of the room to the user's clipboard
    $(document).on('click','.copyID',function(e)
    {
        var $temp = $('<input>');
        $('body').append($temp);

        $temp.val(e.target.name).select();

        document.execCommand("copy");
        $temp.remove();

        $(e.target).text("COPIED");

        setTimeout(function()
        {
            $(e.target).text("Copy room ID");
        }, 2000)
    })

    //If room as password enabled, show password field
    $('#privacyRoomSwitch > label :checkbox').change(function()
    {
        if(this.checked)
        {
            $('#createRoomForm :nth-child(3)').show();
        }
        else
        {
            $('#createRoomForm :nth-child(3)').hide()
            $('#createRoomForm :nth-child(3) > input').val("");
            $('#createRoomForm :nth-child(3) > input').removeClass("invalid");
            $('#createRoomForm :nth-child(3) > input').removeClass("valid");
        }
    })

    //On create room form submit
    $('#createRoomForm').submit(function(e)
    {
        e.preventDefault();

        //Disable the button so that the user doesn't spam multiple new rooms
        $('createRoomSubmit').prop('disabled', true);

        var valid = true;
        var inputs = $('#createRoomForm :input');
        var values = {};

        //Check if all the inputs are valid
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

        //If they are valid then create the room
        if(valid)
        {
            values["owner"] = id;

            //Send request to the server to create the room
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
                    //Create the room in the real time database, add the room to the sidebar and join the room
                    db.ref('Rooms/' + data.res + "/Room/").set({videoID: "aQS7Py1Fx0s", videoTime: "0", timestamp: date.getTime(), userCount: "0"});
                    addRoom(values["roomName"], data.res);
                    closeSidebar();
                    joinRoom(data.res, values["roomName"]);
                }
                else
                {
                    alert("Sorry, we are having trouble right now");
                    $('createRoomSubmit').prop('disabled', false);
                }
            })
        }
    })

    //On join room form submit
    $('#joinRoomForm').submit(function(e)
    {
        e.preventDefault();

        $("#joinRoomSubmit").attr('disabled','disabled');

        var roomJoinIDInput = $('#roomJoinIDInput').val();
        var roomJoinPasswordInput = $('#roomJoinPasswordInput').val();

        //Check if input is valid
        if(roomJoinIDInput != "")
        {
            //Check if room exists
            $.get('./getRoomInfo',
            {
                roomID: roomJoinIDInput,
                roomPassword: roomJoinPasswordInput,
                userID: id
            },
            function(data, status)
            {
                //Room doesn't exist
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
                //Wrong password
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
                //Joined the room, refresh page to show new room
                else if(data["code"] == "200")
                {
                    addRoom(data["roomName"], roomJoinIDInput);
                    joinRoom(roomJoinIDInput, data["roomName"]);
                }
            })
        }
        else
        {
            $('#joinRoomForm > div > input').addClass("invalid");
        }
    })

    //Add room to sidebar
    function addRoom(name, id)
    {
        var roomName = "<p class='roomName'>" + name + "</p>";
        var viewersImg = "<i class='viewersImg material-icons small prefix disable-select'> visibility </i>";
        var viewersCount = "<p class='viewersCount' > 0 </p> "    

        //Create a div with the room details
        $('#myRooms').append("<div class='roomTag' name=" + id + " id=" + id + "><div>" + roomName + "<div>" + viewersCount + viewersImg + "</div></div></div><div class='roomOptions'><a class='copyID' name='" + id + "'>Copy room ID</a></div><hr>");

        //Get amount of users in the room atm
        db.ref('Rooms/' + id + "/Room/Users").on('value', function(snapshot)
        {
            if(snapshot.val())
            {
                $('#myRooms > #' + id + ' > div > div > p').text(Object.keys(snapshot.val()).length);
            }
            else
            {
                $('#myRooms > #' + id + ' > div > div > p').text("0");
            }
        })
    }

    //Join room function
    function joinRoom(roomID, roomName)
    {
        //Toggle sidebar off
        sidebarToggle();

        //Start video controls
        startControls();

        //Check if the room is playing/paused/etc
        checkStatus(roomID);

        //Get random youtube search results
        getRandomResults();

        //Create leave room button on the room
        $('.roomTag[name=' + roomID + ']').next().append("<div id='leaveRoom' name=" + roomID + ">Leave room</div>");

        //If it's trying to join the same room, leave it first
        if(joinedRoomID)
        {
            leaveRoom(joinedRoomID);
        }

        //Add info to sidebar
        $('#roomDetails').show();
        $('#roomName').text(roomName);

        joinedRoomID = roomID;

        //Get data from the room
        db.ref('Rooms/' + roomID + "/Room/").once('value').then(function(data) 
        {
            //Remove hashtags because the real time database doesn't like those :)
            var userID = id.replace('#', "");

            removeChar(userID, "#", function(userID)
            {
                db.ref('Rooms/' + roomID + "/Room/Users/" + userID + "/").set({joined: + new Date()});
            })

            //Get values from the database
            videoTime = data.val()["videoTime"];
            player.loadVideoById(data.val()["videoID"]);

            //Grab users from the database
            db.ref('Rooms/' + roomID + "/Room/Users/").once('value').then(function(data)
            { 
                var lowTimestampIndex = 0;
                var lowTimestamp = data.val()[Object.keys(data.val())[lowTimestampIndex]]["joined"];

                //Prepare the sidebar to intake all the users in the room
                $('#userCount').empty();
                $('#userCount').append('<p> Number of users - ' + Object.keys(data.val()).length + '</p>');
                
                //Check for the lowest timestamp
                for(var i = 0; i < Object.keys(data.val()).length; i++)
                {
                    if(lowTimestamp > data.val()[Object.keys(data.val())[i]]["joined"])
                    {
                        lowTimestamp = data.val()[Object.keys(data.val())[i]]["joined"];
                        lowTimestampIndex = i;
                    }
                }

                //Add the hashtag again
                addChar(Object.keys(data.val())[lowTimestampIndex], "#", Object.keys(data.val())[lowTimestampIndex].length-4, function(data)
                {
                    //If this user is the oldest user in the room, people sync to him, else he syncs to someone else
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

            //Wait a second to make sure everything else is done before running this function to seek to the video time
            setTimeout(function()
            {
                player.seekTo(videoTime);
                firstPlay = true;

                if(data.val()["playStatus"] == 1)
                {
                    player.playVideo();
                }
                else
                {
                    player.pauseVideo();
                }
                
            }, 1000);

            //Welcome message
            $('#messages').append("<div class='server'><p class='nameTag'>" + "Server" + "</p><hr><p class='message'>" + "Welcome to " + $('#myRooms > #' + roomID + ' > div > p').html() + "</p></div>");

            //Update the chat with all the texts
            updateChat();

            //Continuous function that checks for new chats
            checkForNewChats();
        })

        //Display all the users in the room on the sidebar (and keeps on updating everytime it changes)
        db.ref('Rooms/' + roomID + '/Room/Users/').on('value', function(data)
        {
            if(data.val())
            {
                //Get users
                var roomUserList = Object.keys(data.val());

                if(roomUserList)
                {
                    for(var i = 0; i < Object.keys(data.val()).length; i++)
                    {
                        addChar(roomUserList[i], "#", roomUserList[i].length-4, function(data)
                        {
                            roomUserList[i] = data;
                        })
                        
                        if(i+1 >= Object.keys(data.val()).length)
                        {
                            //Get pictures of all the users in the room
                            getPictures(roomUserList, function(picturesArray)
                            {
                                $('#roomUsernames').empty();
                                //Append all the users to the list with their respective pictures
                                for(var j = 0; j < Object.keys(picturesArray).length; j++)
                                {
                                    $('#roomUsernames').append('<div name="' + Object.keys(picturesArray)[j] + '"><p>' + Object.keys(picturesArray)[j].slice(0, -5) + '</p><img src="https://api.adorable.io/avatars/200/' + picturesArray[Object.keys(picturesArray)[j]] + '.png"</img></div>');
                                }
                            });
                        }
                    }
                }
            }
        })

        //Animations to fade everything out and display the current room
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

    //Function to leave the room
    function leaveRoom(room)
    {
        $('#room').hide();
        $('#roomDetails').hide();
        $('#initialScreen').show();
        $('#leaveRoom').remove();

        clearInterval(checkVideoTime);

        removeChar(id, "#", function(userID)
        {
            db.ref('Rooms/' + room + "/Room/Users/" + userID).remove();
        })
    }

    //Grab all the pictures from the users in the room
    function getPictures(userList, callback)
    {
        //Ask the server for the pictures
        $.get('./userPicture',
        {
            users: userList
        },
        function(data, status)
        {
            if(data["code"] == "200")
            {
                callback(data["data"]);
            }
            else
            {
                callback();
            }
        })
    }


    /************************************ SYNCHRONIZATION ***********************************/

    //Check for synchronization
    function masterSynchronize(bool)
    {
        if(bool)
        {
            //If synching to this user then save his play time on the server
            if(syncMe)
            {
                synchronize = setInterval(function()
                {
                    db.ref('Rooms/' + joinedRoomID + "/Room/").update({videoTime: Math.trunc(player.getCurrentTime()), timestamp: + new Date()});
                },2500)
            }
            //Else get the play time only once at startup
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

    /************************************ CHAT ***********************************/

    //On sending a message
    $('#sendMessageBtn').click(function()
    {  
        //If it's not empty
        if($('#sendMessageInput').val())
        {
            //Filter the message to prevent injections
            var message = $('#sendMessageInput').val().replace(/</g, "&lt;").replace(/>/g, "&gt;");

            //Save message
            db.ref('Rooms/' + joinedRoomID + "/Chat/").once('value').then(function(data) 
            {
                if(data.val())
                {
                    db.ref('Rooms/' + joinedRoomID + "/Chat/" + data.val().length + "/").set({name: id, message: message});
                    $('#sendMessageInput').val("");
                }
                else
                {
                    db.ref('Rooms/' + joinedRoomID + "/Chat/0/").set({name: id, message: message});
                    $('#sendMessageInput').val("");
                }
            })
        }
    })

    //On enter key, send message
    $('#sendMessage').keypress(function(e)
    {
        if(e.keyCode == 13)
        {
            $('#sendMessageBtn').click();
        }
    })

    //Check for new messages on the real time database
    function checkForNewChats()
    {
        db.ref('Rooms/' + joinedRoomID + '/Chat/').on('value', function(data)
        {
            updateChat();
        })
    }

    //Get all the messages from the database and display them on the chat
    function updateChat()
    {
        $('#messages').empty();
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
                            if($('#messages > div:last-child > .nameTag').text() == data.val()[i]["name"] || $('#messages > div:last-child').attr('name') == data.val()[i]["name"])
                            {
                                $('#messages').append("<div name='" + data.val()[i]["name"] + "'><p class='message'>" + data.val()[i]["message"] + "</p></div>");
                            }
                            else
                            {
                                $('#messages').append("<div><p class='nameTag'>" + data.val()[i]["name"] + "</p><p class='message'>" + data.val()[i]["message"] + "</p></div>");
                            }
                        }
                    }

                    //Always make sure to scroll down
                    if(i+1 >= data.val().length)
                    {
                        $("#messages").scrollTop($("#messages")[0].scrollHeight);
                    }
                }
            }
        })
    }

    /************************************ SEARCH ***********************************/

    //On enter key press, submit search
    $('#searchBarInput').keypress(function(e)
    {
        if(e.keyCode == 13)
        {
            $('#searchBarInput').submit();
        }
    })
    
    //On submit search click, submit the input
    $('#submitSearch').click(function() 
    {
        $('#searchBarInput').submit();
    })

    //On search bar input submit
    $('#searchBarInput').submit(function()
    {
        //If the val is different from nothing
        if($('#searchBarInput').val() != "")
        {
            //Check if its a youtube link
            if($('#searchBarInput').val().indexOf("youtube.com/watch?v=") >= 0)
            {
                var youtubeVideoID = "";
                for(var i = $('#searchBarInput').val().indexOf("youtube.com/watch?v=") + 20; i < $('#searchBarInput').val().length; i++)
                {
                    youtubeVideoID += $('#searchBarInput').val()[i];

                    if(i+1 >= $('#searchBarInput').val().length)
                    {
                        player.loadVideoById(youtubeVideoID);
                        db.ref('Rooms/' + joinedRoomID + "/Room/").update({videoID: youtubeVideoID, videoTime: "0", playStatus: "4"});
                    }
                }
            }
            else
            {
                //Else search on youtube
                getRequest($('#searchBarInput').val());
            }
            
            $([document.documentElement, document.body]).animate
            ({
                scrollTop: $("#searchBar").offset().top
            }, 2000);
        }
    })

    //Use the youtube search API to retrieve results from the search
    function getRequest(searchTerm) 
    {
        var url = 'https://www.googleapis.com/youtube/v3/search';
        var params = 
        {
            part: 'snippet',
            key: 'AIzaSyAyxRNY0pJ7ujfADgPZKYtVkvGOeaz02Gs',
            maxResults: "3",
            q: searchTerm
        };
      
        $.getJSON(url, params, showResults);
    }
    
    //Parse and display the youtube search results
    function showResults(results) 
    {
        var html = "";
        var entries = results.items;
        
        $.each(entries, function (index, value) 
        {
            var title = value.snippet.title;
            var thumbnail = value.snippet.thumbnails.medium.url;
            var id = value.id.videoId;
            html += "<div class='thumbnail' name=" + id + ">";
            html += "<div name=" + id + "><div class='thumbnailImage' name=" + id + " style='background: url(" + thumbnail + ") center no-repeat'></div>";
            html += "<span class='card-title grey-text text-darken-4' name=" + id + ">" + title + "</span></div><p name=" + id + "><a name=" + id + ">Play</a></p>";
            html += "</div>";
        }); 
        
        $('#searchResults').html(html);
        $('.thumbnailImage').css('height', ($('.thumbnailImage').width() * 9)/16);
    }

    //Use a random word API to do a random search when joining a new room
    function getRandomResults()
    {
        fetch('https://random-word-api.herokuapp.com/word?number=1')
        .then(res => res.json())
        .then(json =>
        {
            getRequest(json);
        })
    }

    //On video click, play it on the room
    $(document).on('click','.thumbnail',function(e)
    {
        player.loadVideoById($(e.target).attr('name'));
        db.ref('Rooms/' + joinedRoomID + "/Room/").update({videoID: $(e.target).attr('name'), videoTime: "0", playStatus: "4"});
    })

})

/************************************ GENERAL FUNCTIONS ***********************************/

//Function to remove a char
function removeChar(id, char, callback)
{
    callback(id.replace(char, ""))
}

//Function to add a char
function addChar(id, char, index, callback)
{
    callback(id.slice(0, index) + char + id.slice(index))
}

//Function to get a cookie from the browser
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

//Function to set a cookie in the browser
function setCookie(cname, cvalue, exdays) 
{
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}