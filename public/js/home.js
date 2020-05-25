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

    /****************************** YOUTUBE PLAYER **********************************/

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

    function onPlayerReady(e) 
    {
        e.target.setVolume(0);
        $('#volumeControl').text("volume_mute")
    }

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

    $('#controlSlider').draggable
    ({
        axis: "x",
        containment: 'parent'
    });

    $('#controlSlider').mousedown(function()
    {
        isDraggingControlSlider = false;
        isClicked = true;
    }) 

    $('#controlSlider').mousemove(function()
    {
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
            //console.log($('.determinate').width());
        }
    })

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

    function startControls()
    {
        checkVideoTime = setInterval(function()
        {
            if(!boolControlSliderInitialLeft)
            {
                controlSliderInitialLeft = $('#controlSlider').position().left;
                if(controlSliderInitialLeft != 0)
                {
                    boolControlSliderInitialLeft = true;
                }
            } 

            var parseCurrentPlayTime = Math.trunc(player.getCurrentTime());
            var parseCurrentPlayTimeSeconds = Math.trunc(parseCurrentPlayTime%60);

            //Makes a number look like 2:03 instead of 2:3
            if(parseCurrentPlayTimeSeconds < 10)
            {
                parseCurrentPlayTimeSeconds = "0" + parseCurrentPlayTimeSeconds;
            }

            //Update playtime values
            $('#playTimeNumbers').text(Math.trunc(parseCurrentPlayTime/60) + ":" + parseCurrentPlayTimeSeconds + " / " + Math.trunc(player.getDuration()/60) + ":" + Math.trunc(player.getDuration()%60));

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

    function checkStatus(roomID)
    {
        db.ref('Rooms/' + roomID + "/Room/playStatus").on('value', function(snapshot)
        {
            if(snapshot.val() == 1)
            {
                player.playVideo();
            }
            else if(snapshot.val() == 2)
            {
                player.pauseVideo();
            }
            else if(snapshot.val() == 3)
            {
                db.ref('Rooms/' + roomID + "/Room/videoTime").once('value', function(snapshot)
                {
                    player.seekTo(snapshot.val());
                })
            }
        })
    }

    /************************************ SIDEBAR ***********************************/

    $('#sidebarToggle').click(function()
    {
        sidebarToggle();
    })

    $(document).on('click','.roomTag',function()
    {
        joinRoom($(this).attr('name'), $(this).children('div').children('p').text());
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

    $('#logOut').click(function()
    {
        setCookie('username', "", -1);
        window.location.href = '/';
    })

    $(document).on('click','#leaveRoom',function()
    {
        leaveRoom($(this).attr('name'));
        $(this).remove();
    })

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
                    //db.ref('Rooms/' + data.res + "/Chat/0/").set({name: "Server", message: "Welcome"});
                    db.ref('Rooms/' + data.res + "/Room/").set({videoID: "aQS7Py1Fx0s", videoTime: "0", timestamp: date.getTime(), userCount: "0"});
                    addRoom(values["roomName"], data.res);
                    closeSidebar();
                    joinRoom(data.res, values["roomName"]);
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

    function addRoom(name, id)
    {
        var roomName = "<p class='roomName'>" + name + "</p>";
        var viewersImg = "<i class='viewersImg material-icons small prefix disable-select'> visibility </i>";
        var viewersCount = "<p class='viewersCount' > 0 </p> "    

        $('#myRooms').append("<div class='roomTag' name=" + id + " id=" + id + "><div>" + roomName + "<div>" + viewersCount + viewersImg + "</div></div></div><div class='roomOptions'><a class='copyID' name='" + id + "'>Copy room ID</a></div><hr>");

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

    function joinRoom(roomID, roomName)
    {
        sidebarToggle();
        startControls();
        checkStatus(roomID);
        getRandomResults();

        $('.roomTag[name=' + roomID + ']').next().append("<div id='leaveRoom' name=" + roomID + ">Leave room</div>");

        if(joinedRoomID)
        {
            leaveRoom(joinedRoomID);
        }

        //Add info to sidebar
        $('#roomDetails').show();
        $('#roomName').text(roomName);

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
                var roomUserList = Object.keys(data.val());

                $('#userCount').empty();
                $('#userCount').append('<p> Number of users - ' + Object.keys(data.val()).length + '</p>');
                
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

            updateChat();
            checkForNewChats();
        })

        db.ref('Rooms/' + roomID + '/Room/Users/').on('value', function(data)
        {
            if(data.val())
            {
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
                            getPictures(roomUserList, function(picturesArray)
                            {
                                $('#roomUsernames').empty();
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

    function getPictures(userList, callback)
    {
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

    /************************************ CHAT ***********************************/

    $('#sendMessageBtn').click(function()
    {
        if($('#sendMessageInput').val())
        {
            var message = $('#sendMessageInput').val().replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

    $('#sendMessage').keypress(function(e)
    {
        if(e.keyCode == 13)
        {
            $('#sendMessageBtn').click();
        }
    })

    function checkForNewChats()
    {
        db.ref('Rooms/' + joinedRoomID + '/Chat/').on('value', function(data)
        {
            updateChat();
        })
    }

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

                    if(i+1 >= data.val().length)
                    {
                        $("#messages").scrollTop($("#messages")[0].scrollHeight);
                    }
                }
            }
        })
    }

    /************************************ SEARCH ***********************************/

    $('#searchBarInput').keypress(function(e)
    {
        if(e.keyCode == 13)
        {
            $('#searchBarInput').submit();
        }
    })
    
    $('#submitSearch').click(function() 
    {
        $('#searchBarInput').submit();
    })

    $('#searchBarInput').submit(function()
    {
        if($('#searchBarInput').val() != "")
        {
            if($('#searchBarInput').val().indexOf("youtube.com/watch?v=") >= 0)
            {
                var youtubeVideoID = "";
                for(var i = $('#searchBarInput').val().indexOf("youtube.com/watch?v=") + 20; i < $('#searchBarInput').val().length; i++)
                {
                    youtubeVideoID += $('#searchBarInput').val()[i];

                    if(i+1 >= $('#searchBarInput').val().length)
                    {
                        player.loadVideoById(youtubeVideoID);
                    }
                }
            }
            else
            {
                getRequest($('#searchBarInput').val());
            }
            
            $([document.documentElement, document.body]).animate
            ({
                scrollTop: $("#searchBar").offset().top
            }, 2000);
        }
    })

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
    
    function showResults(results) 
    {
        var html = "";
        var entries = results.items;
        
        $.each(entries, function (index, value) 
        {
            var title = value.snippet.title;
            var thumbnail = value.snippet.thumbnails.medium.url;
            var id = value.id.videoId;
            html += "<div class='thumbnail'>";
            html += "<div><div class='thumbnailImage' style='background: url(" + thumbnail + ") center no-repeat'></div>";
            html += "<span class='card-title grey-text text-darken-4'>" + title + "</span></div><p><a>Play</a></p>";
            html += "</div>";
        }); 
        
        $('#searchResults').html(html);
        $('.thumbnailImage').css('height', ($('.thumbnailImage').width() * 9)/16);
    }

    function getRandomResults()
    {
        fetch('https://random-word-api.herokuapp.com/word?number=1')
        .then(res => res.json())
        .then(json =>
        {
            getRequest(json);
        })
    }

})

/************************************ GENERAL FUNCTIONS ***********************************/

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