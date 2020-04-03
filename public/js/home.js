var sidebarOpen = false;
var registerPasswordVisibility = false;
var registerConfirmPasswordVisibility = false;

if(getCookie("username"))
{
    window.location.href="/feed";
}

$(document).ready(function()
{
    /***************************** SETUP *********************************/
    //Variables
    var stickyHeader = $("header").offset();
    var sideNavWidth = $(window).width() * 0.2;

    //Hiding elements
    $('#formRegister').hide();

    //Positioning/Sizing - Content
    $('#content').css("padding-bottom", $("footer").height() + 50);

    //Positioning/Sizing - Header
    $('#logo').css("margin-left", ($('#videoStreamingCard').position()).left);

    //console.log(($(window).width() + " | " + ($('#multipleDevicesCard').position()).left) + " | " + $('#multipleDevicesCard').width() + " | " + $('#loginButtons').width())
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
            sideNavWidth = $(window).width() * 0.2;

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

    $('#login, #createRoomBtn').click(function()
    {
        openSidebar();
    })

    $('#back').click(function()
    {
        closeSidebar();
    })

    $('#registerBtn').click(function()
    {
        $('#formLogin').fadeOut("fast");
        setTimeout(function()
        {
            $('#formRegister').fadeIn("slow");
        }, 300);
    })

    $('#backRegister').click(function()
    {
        $('#formRegister').fadeOut("fast");
        setTimeout(function()
        {
            $('#formLogin').fadeIn("slow");
        }, 300);
    })

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

    $('#registerSubmit').click(function()
    {
        $('#formRegister > form').submit(); 
    })

    $('#loginSubmit').click(function()
    {
        $('#formLogin > form').submit();
    })

    $('#emailInput').focus(function()
    {
        $('#formLoginInputs > div:first-child > span').attr("data-error", "Not a valid email address");
    })

    /****************************** SUBMISSIONS *********************************/

    $('#formRegister > form').submit(function(e)
    {
        e.preventDefault();

        $('#registerSubmit').addClass("disabled");

        var valid = true;
        var inputs = $('#formRegisterInputs :input');
        var values = {};

        inputs.each(function()
        {
            values[this.name] = $(this).val();
            if(!$(this).hasClass("valid")) { valid = false; }
        })

        if(values["password"] != values["confirmPassword"])
        {
            valid = false;
            $('#formRegisterInputs > div:nth-child(4) > span').attr("data-error", "Password doesn't match");
            $('#formRegisterInputs > div:nth-child(4) > input').removeClass("valid");
            $('#formRegisterInputs > div:nth-child(4) > input').addClass("invalid");
            M.updateTextFields();
        }

        if(valid)
        {
            $.post('/register',
            {
                data: values
            },
            function(data, status)
            {
                $('#registerSubmit').removeClass("disabled");

                if(data.code == "200")
                {
                    $('#backRegister').click();
                }
                if(data.code == "409")
                {
                    console.log(data.err);
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
    })

    $('#formLogin > form').submit(function(e)
    {
        e.preventDefault();

        $('#loginSubmit').addClass("disabled");

        var valid = true;
        var inputs = $('#formLoginInputs :input');
        var values = {};

        inputs.each(function()
        {
            values[this.name] = $(this).val();
            if(!$(this).hasClass("valid")) { valid = false; }
        })

        $.post('/login',
        {
            data: values
        },
        function(data, status)
        {
            $('#loginSubmit').removeClass("disabled");

            if(data.code == "200")
            {
                console.log("Logged in");
                setCookie("username", data.id, 1);
                window.location.href = "/feed";
            }
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
    })

    /****************************** FUNCTIONS *********************************/

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
    
            $('#loginButtons').animate
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

        $('#loginButtons').animate
        ({
            opacity: 1
        });

        $('#logo').animate
        ({
            marginLeft: ($('#videoStreamingCard').position()).left + (sideNavWidth/2)
        })
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