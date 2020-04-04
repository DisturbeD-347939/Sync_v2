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

    //Hiding
    $('#createRoomForm :nth-child(3)').hide();
    $('#createRoom').hide();
    $('#sidebarToggle').hide();

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
    }

    //Clicks
    $('#logOut').click(function()
    {
        setCookie('username', "", -1);
        window.location.href = '/';
    })

    $('#createRoomBtn').click(function()
    {
        $('#initialScreen').fadeOut("fast", function()
        {
            $('#createRoom').fadeIn("fast");
        })
    })

    $('#createRoomSubmit').click(function()
    {
        $('#createRoomForm').submit();
    })

    $('#sidebarToggle').click(function()
    {
        sidebarToggle();
    })

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
                if(data.code == "200")
                {
                    db.ref('Chats/' + data.res + "/1/").set({name: "Server", message: "Welcome"});
                    addRoom(values["roomName"], data.res);
                    closeSidebar();
                    joinRoom(data.res);
                }
            })
        }
    })

    /****************************** FUNCTIONS **********************************/

    function addRoom(name, id)
    {
        var roomName = "<p class='roomName'>" + name + "</p>";
        var viewersImg = "<i class='viewersImg material-icons small prefix disable-select'> visibility </i>";
        var viewersCount = "<p class='viewersCount' > 1 </p> "

        $('#myRooms').append("<div class='roomTag' name=" + id + "><div>" + roomName + "<div>" + viewersImg + viewersCount + "</div></div></div><hr>");
    }

    function joinRoom(id)
    {
        console.log("Joining " + id);
        $('#initialScreen').hide();
        $('#createRoom').hide();
        $('#room').show();
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