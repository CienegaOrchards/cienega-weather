// var myData = [{"time":"2014-09-07T00:00:00Z","low":39,"lowmid":55,"mid":59,"highmid":65,"high":94},{"time":"2014-10-07T00:00:00Z","low":38,"lowmid":51,"mid":55,"highmid":59,"high":78},{"time":"2014-11-06T00:00:00Z","low":26,"lowmid":36,"mid":40,"highmid":46,"high":69},{"time":"2014-12-06T00:00:00Z","low":24,"lowmid":41,"mid":44,"highmid":47,"high":61},{"time":"2015-01-05T00:00:00Z","low":30,"lowmid":40,"mid":42,"highmid":46,"high":62},{"time":"2015-02-04T00:00:00Z","low":32,"lowmid":43,"mid":47,"highmid":50,"high":65},{"time":"2015-03-06T00:00:00Z","low":29,"lowmid":44,"mid":48,"highmid":52,"high":71},{"time":"2015-04-05T00:00:00Z","low":34,"lowmid":48,"mid":52,"highmid":55,"high":76},{"time":"2015-05-05T00:00:00Z","low":41,"lowmid":55,"mid":58,"highmid":63,"high":83},{"time":"2015-06-04T00:00:00Z","low":46,"lowmid":56,"mid":60,"highmid":64,"high":83},{"time":"2015-07-04T00:00:00Z","low":51,"lowmid":59,"mid":62,"highmid":67,"high":83}];

function drawChart()
{
    var t_data = new google.visualization.DataTable();

    t_data.addColumn({id:'date', type: 'date', role: 'domain', label: 'Date/Time'});

    t_data.addColumn({id:'temp_median', type: 'number', role: 'data', label: 'Temp Median'});
    t_data.addColumn({id:'temp_tooltip', type:'string', role:'tooltip', p: { html : true }});

    t_data.addColumn({id:'temp_low', type:'number', role:'interval', label: 'Temp Min'});
    t_data.addColumn({id:'temp_lowmid', type:'number', role:'interval', label: 'Temp 40%'});
    t_data.addColumn({id:'temp_highmid', type:'number', role:'interval', label: 'Temp 60%'});
    t_data.addColumn({id:'temp_high', type:'number', role:'interval', label: 'Temp Max'});

    t_data.addColumn({id:'freeze', type: 'number', role: 'data', label: 'Freeze'});
    t_data.addColumn({id:'freeze_tooltip', type:'string', role:'tooltip', p: { html : true }});


    var h_data = new google.visualization.DataTable();

    h_data.addColumn({id:'date', type: 'date', role: 'domain', label: 'Date/Time'});

    h_data.addColumn({id:'hum_median', type: 'number', role: 'data', label: 'Humidity Median'});
    h_data.addColumn({id:'hum_tooltip', type:'string', role:'tooltip', p: { html : true }});

    h_data.addColumn({id:'hum_low', type:'number', role:'interval', label: 'Humidity Min'});
    h_data.addColumn({id:'hum_lowmid', type:'number', role:'interval', label: 'Humidity 40%'});
    h_data.addColumn({id:'hum_highmid', type:'number', role:'interval', label: 'Humidity 60%'});
    h_data.addColumn({id:'hum_high', type:'number', role:'interval', label: 'Humidity Max'});

    var b_data = new google.visualization.DataTable();

    b_data.addColumn({id:'date', type: 'date', role: 'domain', label: 'Date/Time'});

    b_data.addColumn({id:'hum_median', type: 'number', role: 'data', label: 'Barometric Pressure Median'});
    b_data.addColumn({id:'hum_tooltip', type:'string', role:'tooltip', p: { html : true }});

    b_data.addColumn({id:'hum_low', type:'number', role:'interval', label: 'Barometric Pressure Min'});
    b_data.addColumn({id:'hum_lowmid', type:'number', role:'interval', label: 'Barometric Pressure 40%'});
    b_data.addColumn({id:'hum_highmid', type:'number', role:'interval', label: 'Barometric Pressure 60%'});
    b_data.addColumn({id:'hum_high', type:'number', role:'interval', label: 'Barometric Pressure Max'});

    $.ajax({url:'weather_data'})
    .done(function(myData)
    {
        var temp_data = [];
        var hum_data  = [];
        var baro_data = [];
        myData.data.forEach(function(point)
        {
            var my_time = moment(point.time);
            temp_data.push([
                my_time._d,

                point.temp_mid,
                '<table class="table table-condensed" style="margin-bottom:0;padding-bottom:0">' +
                    '<tr><td class="text-right" colspan="2">' + my_time.format('DD MMM YYYY') + '</td></tr>' +
                    '<tr class="lead"><td class="text-right">Temperature:</td><th>' + point.temp_mid + '&deg;</th></tr>' +
                    '<tr class="danger"><td class="text-right">Max:</td><th>' + point.temp_high + '&deg;</th></tr>' +
                    '<tr class="info"><td class="text-right">Min:</td><th>' + point.temp_low + '&deg;</th></tr>' +
                '</table>',
                point.temp_low, point.temp_lowmid, point.temp_highmid, point.temp_high,

                point.temp_mid && 28 || null,
                '<table class="table table-condensed" style="margin-bottom:0;padding-bottom:0">' +
                    '<tr class="lead"><td class="text-right">Frost:</td><th>28&deg;</th></tr>' +
                '</table>',
            ]);

            hum_data.push([
                my_time._d,

                point.hum_mid,
                '<table class="table table-condensed" style="margin-bottom:0;padding-bottom:0">' +
                    '<tr><td class="text-right" colspan="2">' + my_time.format('DD MMM YYYY') + '</td></tr>' +
                    '<tr class="lead"><td class="text-right">Humidity:</td><th>' + point.hum_mid + '%</th></tr>' +
                    '<tr class="danger"><td class="text-right">Max:</td><th>' + point.hum_high + '%</th></tr>' +
                    '<tr class="info"><td class="text-right">Min:</td><th>' + point.hum_low + '%</th></tr>' +
                '</table>',
                point.hum_low, point.hum_lowmid, point.hum_highmid, point.hum_high,
            ]);

            baro_data.push([
                my_time._d,

                point.baro_mid,
                '<table class="table table-condensed" style="margin-bottom:0;padding-bottom:0">' +
                    '<tr><td class="text-right" colspan="2">' + my_time.format('DD MMM YYYY') + '</td></tr>' +
                    '<tr class="lead"><td class="text-right">Pressure:</td><th>' + point.baro_mid + '&prime;&nbsp;Hg</th></tr>' +
                    '<tr class="danger"><td class="text-right">Max:</td><th>' + point.baro_high + '&prime;&nbsp;Hg</th></tr>' +
                    '<tr class="info"><td class="text-right">Min:</td><th>' + point.baro_low + '&prime;&nbsp;Hg</th></tr>' +
                '</table>',
                point.baro_low, point.baro_lowmid, point.baro_highmid, point.baro_high,
            ]);
        });

        t_data.addRows(temp_data);
        h_data.addRows(hum_data);
        b_data.addRows(baro_data);

        var temp_options = {
            width: '100%',
            height: 400,
            lineWidth: 2,
            title: 'Temperature (ºF)',
            titlePosition: 'in',
            titleTextStyle: { fontSize: 24 },
            tooltip: { isHtml: true },
            chartArea: { width: '100%', height: '90%' },
            series:
            {
                0: { pointsVisible: true, lineWidth: 2, color: 'navy', curveType: 'function', targetAxisIndex: 0 },
                1: { pointsVisible: false, lineWidth: 4, color: 'crimson', lineDashStyle: [10,10], targetAxisIndex: 0, interpolateNulls: true },
            },
            hAxis: { gridlines: { count: -1, units: { months: { format: ['MMM \'\'yy'] } } }, min: myData.from, max: myData.to },
            vAxes:
            {
                0: { gridlines: { count: -1 }, minorGridlines: { count: 4 }, textPosition: 'in' },
            },
            fontName: 'Lato',
            intervals: { style: 'area' },
            legend: 'none',
            animation:
            {
                duration: 500,
                easing: 'out',
                startup: true,
            }
        };

        var hum_options = {
            width: '100%',
            height: 400,
            lineWidth: 2,
            title: 'Humidity (%age)',
            titlePosition: 'in',
            titleTextStyle: { fontSize: 24 },
            tooltip: { isHtml: true },
            chartArea: { width: '100%', height: '90%' },
            series:
            {
                0: { pointsVisible: true, lineWidth: 2, color: 'dimgray', curveType: 'function', targetAxisIndex: 0 },
            },
            hAxis: { gridlines: { count: -1, units: { months: { format: ['MMM \'\'yy'] } } }, min: myData.from, max: myData.to },
            vAxes:
            {
                0: { gridlines: { count: -1 }, minorGridlines: { count: 4 }, textPosition: 'in' },
            },
            fontName: 'Lato',
            intervals: { style: 'area' },
            legend: 'none',
            animation:
            {
                duration: 500,
                easing: 'out',
                startup: true,
            }
        };

        var baro_options = {
            width: '100%',
            height: 400,
            lineWidth: 2,
            title: 'Barometric Pressure (&prime;&nbsp;Hg)',
            titlePosition: 'in',
            titleTextStyle: { fontSize: 24 },
            tooltip: { isHtml: true },
            chartArea: { width: '100%', height: '90%' },
            series:
            {
                0: { pointsVisible: true, lineWidth: 2, color: 'dimgray', curveType: 'function', targetAxisIndex: 0 },
            },
            hAxis: { gridlines: { count: -1, units: { months: { format: ['MMM \'\'yy'] } } }, min: myData.from, max: myData.to },
            vAxes:
            {
                0: { gridlines: { count: -1 }, minorGridlines: { count: 4 }, textPosition: 'in' },
            },
            fontName: 'Lato',
            intervals: { style: 'area' },
            legend: 'none',
            animation:
            {
                duration: 500,
                easing: 'out',
                startup: true,
            }
        };

        var temp_chart = new google.visualization.LineChart(document.getElementById('temp_chart'));
        temp_chart.draw(t_data, temp_options);

        var hum_chart = new google.visualization.LineChart(document.getElementById('hum_chart'));
        hum_chart.draw(h_data, hum_options);

        var baro_chart = new google.visualization.LineChart(document.getElementById('baro_chart'));
        baro_chart.draw(b_data, baro_options);
    });
}

google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawChart);
