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

    //Positioning
    $('#content').css("padding-bottom", $("footer").height() + 50);

    /****************************** MAIN *********************************/
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


})

function createRoom()
{
    console.log("Create room");
    if(getCookie("email"))
    {
        console.log("Signed in!");
    }
    else
    {
        console.log("Not signed in!");
    }
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