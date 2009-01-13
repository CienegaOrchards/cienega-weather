#!/bin/bash
rrdtool graph humidity.png --start -1w --slope-mode --height 600 --width 1024 \
	--title 'Atmospheric humidity' \
	DEF:humidity=weather.rrd:humidity:MIN \
	LINE:humidity#000000
