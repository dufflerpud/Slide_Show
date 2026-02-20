#!/usr/bin/perl -w
#
#indx#	app.cgi - Web app for viewing categorizing and viewing slides
#@HDR@	$Id$
#@HDR@
#@HDR@	Copyright (c) 2024-2026 Christopher Caldwell (Christopher.M.Caldwell0@gmail.com)
#@HDR@
#@HDR@	Permission is hereby granted, free of charge, to any person
#@HDR@	obtaining a copy of this software and associated documentation
#@HDR@	files (the "Software"), to deal in the Software without
#@HDR@	restriction, including without limitation the rights to use,
#@HDR@	copy, modify, merge, publish, distribute, sublicense, and/or
#@HDR@	sell copies of the Software, and to permit persons to whom
#@HDR@	the Software is furnished to do so, subject to the following
#@HDR@	conditions:
#@HDR@	
#@HDR@	The above copyright notice and this permission notice shall be
#@HDR@	included in all copies or substantial portions of the Software.
#@HDR@	
#@HDR@	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
#@HDR@	KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
#@HDR@	WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
#@HDR@	AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
#@HDR@	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
#@HDR@	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
#@HDR@	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
#@HDR@	OTHER DEALINGS IN THE SOFTWARE.
#
#hist#	2024-04-19 - c.m.caldwell@alumni.unh.edu - Created
#hist#	2026-02-20 - Christopher.M.Caldwell0@gmail.com - Standard header
########################################################################
#doc#	app.cgi - Web app for viewing categorizing and viewing slides
########################################################################

use strict;
use lib "/usr/local/lib/perl";
use cpi_setup qw(setup);
use cpi_translate qw(xlate xprint);
use cpi_template qw(template);
use cpi_cgi qw(show_vars);
use cpi_user qw(logout_select);
use cpi_reorder qw(reorder);
use cpi_file qw(autopsy cleanup fatal files_in);
use cpi_vars;

my $FORMNAME = "form";

&setup(
	stderr=>"Slide_Show",
	Qrequire_captcha=>1,
	Qpreset_language=>"en"
	);

print STDERR __LINE__, " HELPDIR=$cpi_vars::HELPDIR.\n";

our $form_top;
our $css = "";

my %exclusions =
    (
    "audio"	=> '"avideo"',
    "video"	=> '"avideo","slide","text"',
    "avideo"	=> '"audio","slide","text","video"',
    "slide"	=> '"video","avideo","text"',
    "text"	=> '"video","avideo","slide"'
    );

my %media;
my $WWWDIR = $ENV{SCRIPT_FILENAME};
$WWWDIR =~ s/index.cgi$//;
my $PUBLIC_URL = $cpi_vars::URL;
$PUBLIC_URL =~ s+/index\.cgi++;
$PUBLIC_URL =~ s+/app\.cgi++;
$PUBLIC_URL =~ s+\.cgi$++;
my %TEMPLATE =
    (
    "JS"		=> "$cpi_vars::BASEDIR/lib/$cpi_vars::PROG.js",
    "BODY"		=> "$cpi_vars::BASEDIR/lib/$cpi_vars::PROG.html",
    "FOOTER"		=> "$cpi_vars::BASEDIR/lib/footer.html"
    );

#########################################################################
#	Variable declarations.						#
#########################################################################

our $AGENT = $ENV{HTTP_USER_AGENT} || "unknown";
my $is_IOS = ($AGENT =~ /iPad/i || $AGENT =~ /iTouch/i || $AGENT =~ /iPhone/i);
my $CLICKEVENT = ( $is_IOS ? "onTouchStart" : "onClick" );

#########################################################################
#	Return true if the first item appears in the remaining list.	#
#########################################################################
sub inlist
    {
    my( $item, @list ) = @_;
    return grep( $_ eq $item, @list );
    }

#########################################################################
#	Print the slide show.						#
#########################################################################
sub show_player
    {
    my $LOGGER = "formcollector";
    my @pieces = ();
    foreach my $mtype ( keys %media )
        {
	push( @pieces,
	    "\"${mtype}\":\t{ prefix:\"$PUBLIC_URL/$mtype\","
	    . " \"displayer\":put_up_$mtype,\n"
	    . "\t\"exclude\": ["
	    . ($exclusions{$mtype} || "")
	    . "],\n"
	    . "\t\"files\":[\"" . join('","',@{$media{$mtype}}) . "\"]}" );
	}
    &xprint(
        $form_top,
	&template( $TEMPLATE{JS},
	    "%%CLICKEVENT%%", $CLICKEVENT,
	    "%%LOGGER%%", $LOGGER,
	    "%%MEDIA%%", join(",\n",@pieces) ),
	&template( $TEMPLATE{BODY} ),
	$cpi_vars::HELP_IFRAME );
    }

#########################################################################
#	Handle iframe requests.						#
#########################################################################
sub app_intro
    {
    if( $cpi_vars::FORM{query} )
        {
	my $FILE_LOG = "$cpi_vars::BASEDIR/$cpi_vars::PROG.log";
	my( $fnc, $media, $fname ) = split(/:/,$cpi_vars::FORM{query});
	open( OUT, ">> $FILE_LOG" ) ||
	    &autopsy("Cannot append to ${FILE_LOG}:  $!");
	print OUT "$media/$fname $fnc\n";
	close( OUT );
	print "<script>alert('$fnc $media/$fname acknowledged');</script>";
	exit(0);
	}
    }

#########################################################################
#	Used by the common administrative functions.			#
#########################################################################
sub footer
    {
    my( $mode ) = @_;
    my $vmode = "none";
    my $smode = "";

    $mode = "admin" if( !defined($mode) );

    my $fnc = $cpi_vars::FORM{func};
    if( $mode eq "admin" && $fnc ne "view" )
        {
	$vmode = "";
	$smode = "none";
	}

    my $options =
	join("",
	    map { "<option value=$_>XL($_)\n" }
		grep( $_ ne "slide", keys %media ) );

    &xprint(
        &template( $TEMPLATE{FOOTER},
	    "%%SPLIT%%", ( $mode eq "admin" ? "none" : "" ),
	    "%%CLICKEVENT%%", $CLICKEVENT,
	    "%%OPTIONS%%", $options,
	    "%%LOGOUTSELECT%%", &logout_select("footerform"),
	    "%%SMODE%%", $smode,
	    "%%VMODE%%", $vmode
	    ) );
    }

#########################################################################
#	Handle regular user commands					#
#########################################################################
sub user_logic
    {
    my $fnc = ( $cpi_vars::FORM{func} || "" );
    if( $fnc ne "" && $fnc ne "dirmode" && $fnc ne "dologin" && $fnc ne "view" )
        { &fatal("Unrecognized function \"$fnc\"."); }
    &show_player();
    &footer("user");
    }

#########################################################################
#	Main								#
#########################################################################

if( $ENV{SCRIPT_NAME} eq "" )
    {
    &fatal( &xlate( "XL(Usage):  $cpi_vars::PROG.cgi (dump|dumpaccounts|dumptranslations|undump|undumpaccounts|undumptranslations) [ dumpname ]") );
    }

while( defined($_=shift(@cpi_vars::CSS_PER_DEVICE_TYPE)) )
    {
    $css = shift(@cpi_vars::CSS_PER_DEVICE_TYPE);
    last if( $AGENT =~ /$_/ );
    }

srand( time() );

foreach my $mtype ( "slide", "text", "video", "avideo", "audio" )
    {
    next if( $mtype =~ /\./ || ! -d "$WWWDIR/$mtype" );
    @{$media{$mtype}} = &reorder( &files_in( "$WWWDIR/$mtype" ) );
    }

#&show_vars()
#    if( ! &inlist(($cpi_vars::FORM{func}||""),"download","view") );

&check_filespec( $cpi_vars::FORM{arg} )
    if( defined($cpi_vars::FORM{arg}) );
grep( &check_filespec($_), split(/,/,$cpi_vars::FORM{expanded}) )
    if( defined($cpi_vars::FORM{expanded}) );
grep( &check_filespec($_), split(/,/,$cpi_vars::FORM{selected}) )
    if( defined($cpi_vars::FORM{selected}) );

$form_top = <<EOF;
<style>
<!--
$css
-->
</style>
<link href="$cpi_vars::PROG.css" rel="stylesheet" type="text/css" />
<SCRIPT SRC='sprintf.js' TYPE='text/javascript'></SCRIPT>
EOF

&user_logic();

&cleanup(0);
