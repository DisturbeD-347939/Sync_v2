

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
