#!/bin/sh -

PROG=`basename $0`
NEW_PREFIX=http://bup0/~chris/porn

wget -q -O - 'http://fs0/~chris/Slide_Show?user=chris&password=ratcatcher'	\
    | sed -e "s+prefix:\"http.*Slide_Show+prefix:\"$NEW_PREFIX+" 		\
    | ssh bup0 "cd www/porn; dd of=index.html"
tar cCf /home/chris/public_html - porn/audio porn/video porn/avideo porn/text porn/slide \
    | ssh bup0 "cd www; tar xf -"
