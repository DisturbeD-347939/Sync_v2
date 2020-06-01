var sidebarOpen = false;
var registerPasswordVisibility = false;
var registerConfirmPasswordVisibility = false;

if(getCookie("username"))
{
    window.location.href="/home";
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
    var analytics = firebase.analytics();

    //Variables
    var stickyHeader = $("header").offset();
    var sideNavWidth = 350;

    //Hiding elements
    $('#formRegister, #loading').hide();

    //Positioning/Sizing - Content
    $('#content').css("padding-bottom", $("footer").height() + 50);

    //Positioning/Sizing - Header
    $('#logo').css("margin-left", ($('#videoStreamingCard').position()).left);

    //console.log(($(window).width() + " | " + ($('#multipleDevicesCard').position()).left) + " | " + $('#multipleDevicesCard').width() + " | " + $('#loginBtn').width())
    var loginButtonsPos = ($(window).width() - ($('#multipleDevicesCard').position()).left) - $('#multipleDevicesCard').width();
    $('#loginBtn').css("margin-right",  loginButtonsPos);

    //Positioning/Sizing - Sidebar
    $('.sidebar').css("left", $(window).width());
    $('#back').css
    ({
        width: $('#login').width(),
        height: $('#login').height(),
        top: ($('#login').position()).top,
    })

    /****************************** EVENTS *********************************/
    //Sticky header
    window.onscroll = function()
    {
        if(window.pageYOffset > stickyHeader.top)
        {
            $('header').addClass("sticky");
            $('#content').css("padding-top", $('header').height());
        }
        else
        {
            $('header').removeClass("sticky");
            $('#content').css("padding-top","0px");
        }
    }

    window.onresize = function()
    {
        //Positioning - Header
        $('#logo').css("margin-left", ($('#videoStreamingCard').position()).left)

        var loginButtonsPos = ($(window).width() - ($('#multipleDevicesCard').position()).left) - $('#multipleDevicesCard').width();
        $('#loginBtn').css("margin-right", loginButtonsPos);

        //Positioning - Sidebar
        if(sidebarOpen)
        {
            //sideNavWidth = $(window).width() * 0.2;

            $('.sidebar').css
            ({
                width: sideNavWidth,
                left: $(window).width() - sideNavWidth
            });

            $('header, #content, footer').css("marginRight", sideNavWidth);
        }
        else
        {
            $('.sidebar').css("left", $(window).width());
        }
    }

    //Open sidebar
    $('#login, #createRoomBtn').click(function()
    {
        openSidebar();
    })

    //Close sidebar
    $('#back').click(function()
    {
        closeSidebar();
    })

    //Animate the transition
    $('#registerBtn').click(function()
    {
        $('#formLogin').fadeOut("fast");
        setTimeout(function()
        {
            $('#formRegister').fadeIn("slow");
        }, 300);
    })

    //Animate the transition
    $('#backRegister').click(function()
    {
        $('#formRegister').fadeOut("fast");
        setTimeout(function()
        {
            $('#formLogin').fadeIn("slow");
        }, 300);
    })

    //Show/hide passwords on user click
    $('#registerPasswordVisibility').click(function()
    {
        if(registerPasswordVisibility)
        {
            registerPasswordVisibility = false;

            $('#passwordRegisterInput').attr("type", "password");
            $(this).text("visibility_off");
        }
        else
        {
            registerPasswordVisibility = true;

            $('#passwordRegisterInput').attr("type", "text");
            $(this).text("visibility");
        }
    })

    //Show/hide passwords on user click
    $('#registerConfirmPasswordVisibility').click(function()
    {
        if(registerConfirmPasswordVisibility)
        {
            registerConfirmPasswordVisibility = false;

            $('#confirmPasswordRegisterInput').attr("type", "password");
            $(this).text("visibility_off");
        }
        else
        {
            registerConfirmPasswordVisibility = true;

            $('#confirmPasswordRegisterInput').attr("type", "text");
            $(this).text("visibility");
        }
    })

    //Submit form
    $('#registerSubmit').click(function()
    {
        $('#formRegister > form').submit(); 
    })

    //Submit form
    $('#loginSubmit').click(function()
    {
        $('#formLogin > form').submit();
    })

    //Define error message
    $('#emailInput').focus(function()
    {
        $('#formLoginInputs > div:first-child > span').attr("data-error", "Not a valid email address");
    })

    /****************************** REQUESTS *********************************/

    //Submit register
    $('#formRegister > form').submit(function(e)
    {
        e.preventDefault();

        $('#registerSubmit').addClass("disabled");
        $('#loading').show();

        var valid = true;
        var inputs = $('#formRegisterInputs :input');
        var values = {};

        //Check if inputs are valid
        inputs.each(function()
        {
            values[this.name] = $(this).val();
            if(!$(this).hasClass("valid")) { valid = false; }
        })

        //Check if passwords match
        if(values["password"] != values["confirmPassword"])
        {
            valid = false;
            $('#formRegisterInputs > div:nth-child(4) > span').attr("data-error", "Password doesn't match");
            $('#formRegisterInputs > div:nth-child(4) > input').removeClass("valid");
            $('#formRegisterInputs > div:nth-child(4) > input').addClass("invalid");
            M.updateTextFields();
        }

        //If everything is valid, register user
        if(valid)
        {
            $.post('/register',
            {
                data: values
            },
            function(data, status)
            {
                $('#registerSubmit').removeClass("disabled");
                $('#loading').hide();

                //Take user to login
                if(data.code == "200")
                {
                    $('#backRegister').click();
                }
                //Error feedback
                if(data.code == "409")
                {
                    if(data.err == "email")
                    {
                        $('#formRegisterInputs > div:nth-child(2) > span').attr("data-error", "Email taken!");
                        $('#formRegisterInputs > div:nth-child(2) > input').val("");
                        $('#formRegisterInputs > div:nth-child(2) > input').removeClass("valid");
                        $('#formRegisterInputs > div:nth-child(2) > input').addClass("invalid");
                    }
                    else if(data.err == "username")
                    {
                        $('#formRegisterInputs > div:nth-child(1) > span').attr("data-error", "Username taken!");
                        $('#formRegisterInputs > div:nth-child(1) > input').val("");
                        $('#formRegisterInputs > div:nth-child(1) > input').removeClass("valid");
                        $('#formRegisterInputs > div:nth-child(1) > input').addClass("invalid");
                    }
                }
                if(data.code == "500")
                {
                    alert("Sorry, we are having problems with our servers. Try again later");
                    closeSidebar();
                }
            })
        }
        else
        {
            $('#registerSubmit').removeClass("disabled");
            $('#loading').hide();
        }
    })

    //Submit login
    $('#formLogin > form').submit(function(e)
    {
        e.preventDefault();

        $('#loginSubmit').addClass("disabled");
        $('#loading').show();

        var valid = true;
        var inputs = $('#formLoginInputs :input');
        var values = {};

        //Check if inputs are valid
        inputs.each(function()
        {
            values[this.name] = $(this).val();
            if(!$(this).hasClass("valid")) { valid = false; }
        })

        //Login user if inputs are valid
        if(valid)
        {
            $.post('/login',
            {
                data: values
            },
            function(data, status)
            {
                $('#loginSubmit').removeClass("disabled");
                $('#loading').hide();
    
                //Login user and set cookie
                if(data.code == "200")
                {
                    setCookie("username", data.id, 1);
                    analytics.logEvent('log_in');
                    window.location.href = "/home";
                }
                //Error feedback
                if(data.code == "409")
                {
                    $('#formLoginInputs > div:first-child > span').attr("data-error", "Wrong email/password");
                    $('#formLoginInputs > div > input').val("");
                    $('#formLoginInputs > div > input').removeClass("valid");
                    $('#formLoginInputs > div > input').addClass("invalid");
                }
                if(data.code == "500")
                {
                    alert("Sorry, we are having problems with our servers. Try again later");
                    closeSidebar();
                }
            })
        }
        else
        {
            $('#loginSubmit').removeClass("disabled");
            $('#loading').hide();
        }
    })

    /****************************** FUNCTIONS *********************************/

    //Animate sidebar open
    function openSidebar()
    {
        if(!sidebarOpen)
        {
            sidebarOpen = true;

            $('.sidebar').animate
            ({
                width: sideNavWidth,
                left: $(window).width() - sideNavWidth
            });
    
            $('header, #content').animate
            ({
                marginRight: sideNavWidth
            });
    
            $('#loginBtn').animate
            ({
                opacity: 0
            });

            $('#logo').animate
            ({
                marginLeft: ($('#videoStreamingCard').position()).left - (sideNavWidth/2)
            })

            $('footer').animate
            ({
                right: sideNavWidth/2
            })

        }
    }


    //Animate sidebar close
    function closeSidebar()
    {
        sidebarOpen = false;

        $('footer').animate
        ({
            right: 0
        })

        $('.sidebar').animate
        ({
            width: 0,
            left: $(window).width()
        })

        $('header, #content, footer').animate
        ({
            marginRight: 0
        });

        $('#loginBtn').animate
        ({
            opacity: 1
        });

        $('#logo').animate
        ({
            marginLeft: ($('#videoStreamingCard').position()).left + (sideNavWidth/2)
        })
    }
})

//Get cookies
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

//Set cookies
function setCookie(cname, cvalue, exdays) 
{
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}