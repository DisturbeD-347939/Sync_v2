

$(document).ready(function()
{
    /***************************** SETUP *********************************/
    //Variables
    var stickyHeader = $("header").offset();

    //Hiding elements
    $('#logout').hide();

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
