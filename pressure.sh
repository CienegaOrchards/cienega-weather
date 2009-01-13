#!/bin/bash
rrdtool graph pressure.png --start -1w --slope-mode --height 600 --width 1024 \
	--title 'Atmospheric pressure' \
	-A -Y -X 0\
	DEF:pressure=weather.rrd:pressure:MIN \
	CDEF:mbar=pressure,33.86,* \
	LINE:mbar#000000
