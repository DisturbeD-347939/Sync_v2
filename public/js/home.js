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
    $('#loginButtons').css("margin-right",  loginButtonsPos);

    //Positioning/Sizing - Sidebar
    $('.sidebar').css("left", $(window).width());
    $('#back').css
    ({
        width: $('#login').width(),
        height: $('#login').height(),
        top: ($('#login').position()).top,
    })

    $('#emailInput').focus();

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
        $('#loginButtons').css("margin-right",  loginButtonsPos);

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
        if(getCookie("email"))
        {
            console.log("Signed in!");
        }
        else
        {
            openSidebar();
        }
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

    /****************************** SUBMISSIONS *********************************/

    $('#formRegister > form').submit(function(e)
    {
        e.preventDefault();

        $('#registerSubmit').prop('disabled', true);

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
                console.log(data);
                if(data.code == "200")
                {
                    console.log("Success");
                }
                if(data.code == "409")
                {
                    console.log("Email already in use!");
                }
                if(data.code == "500")
                {
                    alert("Sorry, we are having problems with our servers. Try again later");
                }
            })
        }
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
    
            $('header, #content, footer').animate
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
        }
    }

    function closeSidebar()
    {
        sidebarOpen = false;

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