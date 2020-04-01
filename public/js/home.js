

$(document).ready(function()
{
    /***************************** SETUP *********************************/
    //Variables
    var stickyHeader = $("header").offset();

    //Hiding elements
    $('#logout').hide();

    //Positioning
    $('#content').css("padding-bottom", $("footer").height() + 50);
