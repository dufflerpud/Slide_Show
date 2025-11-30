<script>
////////////////////////////////////////////////////////////////////////
//@HDR@	$Id$
//@HDR@		Copyright 2024 by
//@HDR@		Christopher Caldwell/Brightsands
//@HDR@		P.O. Box 401, Bailey Island, ME 04003
//@HDR@		All Rights Reserved
//@HDR@
//@HDR@	This software comprises unpublished confidential information
//@HDR@	of Brightsands and may not be used, copied or made available
//@HDR@	to anyone, except in accordance with the license under which
//@HDR@	it is furnished.
////////////////////////////////////////////////////////////////////////
//	Javascript included in Slide_Show.
//	%%variable%%s are substituted before presented.

var PROGRAM = "%%PROG%%";
var LOGGER = "%%LOGGER%%";
var MEDIA =
    {
%%MEDIA%%
    };

var p = {};
var current_media;
var screen_info;
var have_window_object;

function formatted_date( dobj, show_time_flag )
    {
    var res = sprintf("%02d/%02d/%04d",
        dobj.getMonth()+1, dobj.getDate(), dobj.getFullYear());
    if( show_time_flag )
        { res += sprintf(" %02d:%02d",dobj.getHours(),dobj.getMinutes()); }
    return res;
    }

function get_screen_info()
    {
    screen_info =
        ( window.innerWidth
	? {width:window.innerWidth,height:window.innerHeight*0.90}
	: {width:document.body.offsetWidth,height:document.body.offsetHeight*0.95}
	);
    }

function auto_next()
    {
    footerfunc( "nextb", p.nextb_id );
    }

function fix_image_size()
    {
    var o = p.hidden_id;
    var n = MEDIA.slide.obj;

    if( !o || typeof(o) == "number" )
        { o = have_window_object; }
    else
	{ have_window_object = o; }
    get_screen_info();
    var natural = { width:o.naturalWidth, height:o.naturalHeight };

    screen_info.ratio = 1.0 * screen_info.width / screen_info.height;
    natural.ratio = 1.0 * natural.width / natural.height;

    var new_image = {};

    var ratios =
	{
	width:	( 1.0 * natural.width  / screen_info.width  ),
	height:	( 1.0 * natural.height / screen_info.height )
	};

    if( natural.height / ratios.width <= screen_info.height )
        {
	new_image =
	    {
	    width:	screen_info.width,
	    height:	natural.height / ratios.width
	    }
	}
    else
	{
	new_image =
	    {
	    width:	natural.width / ratios.height,
	    height:	screen_info.height
	    }
	}
    var remains = screen_info.height - new_image.height;
    var above = remains / 2;
    var below = remains - above;

    n.src = o.src;
    n.width=new_image.width;
    n.height=new_image.height;
    n.style.borderTopWidth = above + "px";
    n.style.borderBottomWidth = below + "px";
    if( window.document.footerform.auto_next.checked )
        {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout( auto_next, 400 );
	// footerfunc( "nextb", p.nextb_id );
	}
    }

var resizeTimer;
function browser_resized()
    {
    if( have_window_object )
	{
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout( fix_image_size, 100 );
	}
    }

function clear_but( med )
    {
    if( p.previous_id ) { p.previous_id.style.backgroundColor	= ""; }
    if( p.nextb_id )	{ p.nextb_id.style.backgroundColor	= ""; }
    }

function put_up_slide( op )
    {
    p.hidden_id.src = op.prefix + "/" + op.files[op.showing];
    p.hidden_id.alt = op.files[op.showing];
    }

function update_html( o, nv )
    {
    if( o.obj.lastHTML == nv ) { return; }
    o.obj.lastHTML = nv;
    o.obj.innerHTML = nv;
    }

function put_up_video( op )
    {
    get_screen_info();
    update_html( op,
	  "<embed qtype='video/quicktime'"
	+ " src='"+op.prefix+"/"+op.files[op.showing]+"'"
        + " width="+screen_info.width+" height="+screen_info.height
	+ " repeat=true autostart=true loop=true"
	+ " onLoad='clear_but(\"video\");'>" );
    clear_but("video");
    }

function put_up_avideo( op )
    {
    get_screen_info();
    update_html( op,
	  "<embed qtype='video/quicktime'"
	+ " src='"+op.prefix+"/"+op.files[op.showing]+"'"
        + " width="+screen_info.width+" height="+screen_info.height
	+ " repeat=true autostart=true loop=true"
	+ " onLoad='clear_but(\"avideo\");'>" );
    clear_but("avideo");
    }

function put_up_text( op )
    {
    get_screen_info();
    op.obj.src = op.prefix + "/" + op.files[op.showing];
    op.obj.width = screen_info.width;
    op.obj.height = screen_info.height;
    }

function put_up_audio( op )
    {
    update_html( op,
	  "<embed src='"+op.prefix+"/"+op.files[op.showing]+"'"
	+ " type='audio/mpeg'"
	+ " height=20px repeat=true autostart=true loop=true"
	+ " onLoad='clear_but(\"audio\");'>" );
    op.obj.alt = op.files[op.showing];
    clear_but("audio");
    }

var ids =
    [ "hidden_id", "previous_id", "nextb_id", "media_id", "view_id",
	"mark_id", "query_id", "auto_next_id" ];

function pre_unload()
    {
    return "XL(Page has changed.  Are you sure you want to leave?)";
    }

function start_show()
    {
    for ( var idi in ids  )
        {
	p[ids[idi]] = document.getElementById( ids[idi] );
	}
    for ( o in MEDIA )
        {
	MEDIA[o].obj = document.getElementById( o + "_id" );
	MEDIA[o].showing = 0;
	}
    window.onbeforeunload = pre_unload;
    }

function check_media( mo )
    {
    var seen = {};
    for( var i in mo.files )
        {
	if( seen[ mo.files[i] ] )
	    { alert("Duplicate ["+mo.files[i]+"]"); }
	seen[ mo.files[i] ] = 1;
	}
    }

function media_change( current_media_arg )
    {
    current_media = current_media_arg;
    var media_obj = MEDIA[current_media];
    check_media( media_obj );
    p.mark_id.options[0].text =
	MEDIA[current_media].files[MEDIA[current_media].showing];
    MEDIA[current_media].inuse = 1;
    media_obj.displayer(media_obj);
    p.mark_id.options[0].text = media_obj.files[media_obj.showing];
    media_obj.obj.style.display = "";
    p.previous_id.style.display	= "";
    p.nextb_id.style.display	= "";
    p.mark_id.style.display	= "";
    p.media_id.style.display	= "";
    p.view_id.style.display	= "none";
    
    p.auto_next_id.style.display = (current_media=="slide"?"":"none");

    for( var m in media_obj.exclude )
	{
	var toexclude = media_obj.exclude[m];
	var mo = MEDIA[toexclude];
	if( mo && mo.obj )
	    {
	    MEDIA[toexclude].inuse = 0;
	    if( toexclude=="video"	||
		toexclude=="avideo"	||
		toexclude=="audio"	)
		{
		mo.obj.lastHTML = "";
		mo.obj.innerHTML = "";
		}
	    else
		{ mo.obj.style.display = "none"; }
	    }
	}
    }

function mark_func( obj )
    {
    var fnc = obj.options[obj.selectedIndex].value;
    if( fnc == "Connect" )
        {
	var medlist = new Array();
	var medias = new Array();
	var returndata = new Array();
	var WHEN = formatted_date( new Date(), true );
	var html_media = new Array();
	for( var med in MEDIA )
	    {
	    if( MEDIA[med].inuse )
	        {
		medias.push( med );
		var fn = med + "/" + MEDIA[med].files[ MEDIA[med].showing ];
		medlist.push( fn );
		returndata.push( med + "_filename" );
		returndata.push( fn );
		html_media.push( "<tr class=dataline><td valign=top class='input_ok rowlabel' align=left colspan=1><label for="+med+"_filename>"+med+" filename:</label></td><td valign=top colspan=3 class='input_ok rowdata' align=left>"+fn+"</td></tr>" );
		}
	    }
	var html = "<tr class=legend><th colspan=4><table class=legend width=100%><tr class=legend><th class='input_unanswered legend' width=50%>Not filled in</th><th class='input_ok legend' width=50%>Normal input</th></tr></table></th></tr><tr class=dataline><td valign=top class='input_ok rowlabel' align=left colspan=1><label for=Name>Name:</label></td><td valign=top colspan=3 class='input_ok rowdata' align=left>%%USER%%</td></tr><tr class=dataline><td valign=top class='input_ok rowlabel' align=left colspan=1><label for=When>When:</label></td><td valign=top colspan=3 class='input_ok rowdata' align=left>" + WHEN +"</td></tr><tr class=dataline><td valign=top class='input_ok rowlabel' align=left colspan=1><label for=Event>Event:</label></td><td valign=top colspan=3 class='input_ok rowdata' align=left>Connection</td></tr><tr class=dataline><td valign=top class='input_ok rowlabel' align=left colspan=1><label for=Connection_media>Media:</label></td><td valign=top colspan=3 class='input_ok rowdata' align=left>" + medias.join(", ") + "</td></tr>" + html_media.join("");
	returndata.push(
	    "When",		WHEN,
	    "Name",		"%%USER%%",
	    "Event",		"Connection",
	    "Connection_media",	medias.join(","),
	    "html",		html
	    );
	var q
	    = LOGGER + ".cgi?"
	    + [ "form_type=Health_log",
		"user=anonymous",
		"func=submit",
		"returndata=" + escape(returndata.join("-SEP2-")) ].join("&");
	alert("Submitting to Health_log");
	p.query_id.src = q;
	footerfunc( "redraw" );
	}
    else
	{
	p.query_id.src = PROGRAM + ".cgi?query="
	    + fnc
	    + ":" + current_media
	    + ":" + MEDIA[current_media].files[ MEDIA[current_media].showing ];
	p.mark_id.selectedIndex = 0;
	footerfunc( "nextb", p.nextb_id );
	}
    }
</script>
