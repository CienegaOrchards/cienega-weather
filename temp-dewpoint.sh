#!/bin/bash
rrdtool graph temp-dewpoint.png --start -1w --slope-mode  --height 600 --width 1024 \
	--title 'Temperature and dewpoint' \
	-A -Y -X 0 \
	DEF:temp=weather.rrd:temperature:MIN \
	DEF:dewpoint=weather.rrd:dewpoint:MAX \
	DEF:chill=weather.rrd:chill:MIN  \
	DEF:humidity=weather.rrd:humidity:MIN \
	CDEF:dewpt=humidity,1,100,LIMIT,temp,32,152,LIMIT,+,UN,UNKN,dewpoint,32,122,LIMIT,IF \
	AREA:temp#000000:"Temperature" \
	LINE:chill#00FF00:"Wind chill" \
	LINE:dewpt#0000FF:"Dew point" \
	LINE2:32#FF0000:"Freezing\c"
