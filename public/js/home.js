var sidebarOpen = false;
var registerPasswordVisibility = false;
var registerConfirmPasswordVisibility = false;

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

    {
        var c = ca[i];
        while (c.charAt(0) == ' ') 
        {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) 
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
})