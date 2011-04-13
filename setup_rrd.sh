#!/bin/bash
rrdtool create weather.rrd \
			--start 'January 1' \
			-s 60 \
			\
			DS:temperature:GAUGE:600:0:150 \
			DS:humidity:GAUGE:600:0:100 \
			DS:pressure:GAUGE:600:16.00:33.00 \
			DS:wind_dir:GAUGE:600:0:360 \
			DS:wind_spd:GAUGE:600:0:150 \
			DS:rainfall:DERIVE:600:0:50 \
			DS:chill:GAUGE:600:0:150 \
			DS:temp_celsius:COMPUTE:temperature,32,-,9,/,5,* \
			DS:dewpoint_gamma:COMPUTE:temp_celsius,17.27,*,237.7,temp_celsius,+,/,humidity,100,/,LOG,+ \
			DS:dewpoint_celsius:COMPUTE:237.7,dewpoint_gamma,*,17.27,dewpoint_gamma,-,/ \
			DS:dewpoint:COMPUTE:dewpoint_celsius,5,/,9,*,32,+ \
			\
			RRA:AVERAGE:0.5:1:43200 RRA:MAX:0.5:1:43200 RRA:MIN:0.5:1:43200 \
			RRA:AVERAGE:0.5:15:35040 RRA:MAX:0.5:15:35040 RRA:MIN:0.5:15:35040 \
			RRA:AVERAGE:0.5:60:87600 RRA:MAX:0.5:60:87600 RRA:MIN:0.5:60:87600 \
			RRA:AVERAGE:0.5:1440:3653 RRA:MAX:0.5:1440:3653 RRA:MIN:0.5:1440:3653
