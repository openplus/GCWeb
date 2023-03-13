(function($) {
    var instances = [];
    var svg = [];
    var chartDataStore = [];
    var legendSvg = [];
    var chartLegend = [];
    var placeholderId = [];
    var params = [];
    var classArray = [];
    var lang = document.documentElement.lang;

    /**
     * Set the locale of D3 depending the language of the page
     * @see https://github.com/d3/d3-3.x-api-reference/blob/master/Localization.md#d3_locale
     */
    var localeEN = {
        "decimal": ".",
        "thousands": ",",
        "grouping": [3],
        "currency": ["$", ""],
        "dateTime": "%a %b %e %X %Y",
        "date": "%m/%d/%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }

    var localeFR = {
        "decimal": ",",
        "thousands": "\u00a0",
        "grouping": [3],
        "currency": ["", " $"],
        "dateTime": "%a %b %e %X %Y",
        "date": "%d/%m/%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredri", "Samedi"],
        "shortDays": ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
        "months": ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
        "shortMonths": ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Dec"]
    }

    var locale = d3.locale(lang == 'en' ? localeEN : localeFR);
    
    /**
    * Append an invisiable div to the first d3-chart, to add the SVG pattern
    */
    var pattern = d3.select(".d3-chart", ":first-child")
        .append("div")
        .attr({class: "d3-pattern"})
        .style({height: "0", position: 'absolute', left: '-1000px'});
    
    /**
    * May have to change the color scheme, but it's for testing purpose
    * used this palette : @see https://projects.susielu.com/viz-palette
    * This @see https://fossheim.io/writing/posts/accessible-dataviz-d3-intro/ recommend to not put too much pattern as it can be too busy on the eyes
    * @todo Make multiple swatches so Author can chose which pattern and/or color they want
    */
    createPattern("circle-1", "circle", "#ffd700", "#fff", 1, 5, 5);
    createPattern("dots-1", "dots", "#ffb14e", "#fff", 3);
    createPattern("horizontal-stripe-1", "horizontal-stripe", "#fa8775", "#fff");
    createPattern("diagonal-stripe-1", "diagonal-stripe", "#ea5f94", "#fff");
    createPattern("diagonal-stripe-2", "diagonal-stripe", "#cd34b5", "#fff", 3);
    createPattern("vertical-stripe-1", "vertical-stripe", "#9d02d7", "#fff");
    createPattern("crosshatch-1", "crosshatch", "#0000ff", "#fff", 0.5, 8, 8);

    createPattern("circle-2", "circle", "#800000", "#fff", 1, 5, 5);
    createPattern("horizontal-stripe-2", "horizontal-stripe", "#808000", "#fff", 1, 6, 6);
    createPattern("diagonal-stripe-3", "diagonal-stripe", "#808080", "#fff");
    createPattern("vertical-stripe-2", "diagonal-stripe", "#000080", "#fff");
    createPattern("crosshatch-2", "crosshatch", "#008000", "#fff", 0.5, 8, 8);

    
    $('div.d3-chart').each(function(index, element) {
        /**
        * Get attributes from chart placeholder
        */
        var placeholderClass = this.attributes.class.nodeValue;
            placeholderId[index] = this.attributes.id.nodeValue;
        var placeholderName = this.attributes['data-name'].nodeValue;
        var placeholderParams = this.attributes['data-params'].nodeValue;
            classArray[index] = placeholderClass.split(" ");
            params[index] = $.parseJSON(placeholderParams);
        var placeholderTag = document.getElementById(placeholderName),
            formatOption = setFormat(index),
            placeholderFigCaption = "";

        // Store instances
        if ($.inArray('d3-pie', classArray[index]) > 0) {
            instances[index] = 'pie';
            // placeholderFigCaption = lang == 'en' ? "Donut Chart for " : "Graphique en anneau pour ";
        }
        else if ($.inArray('d3-bar', classArray[index]) > 0) {
            instances[index] = 'bar';
            // placeholderFigCaption = lang == 'en' ? "Bar Chart for " : "Diagramme à bandes pour ";
        }
        else if ($.inArray('d3-table', classArray[index]) > 0) {
            instances[index] = 'table';
        }
        
        chartDataStore[index] = [];
        
        if(placeholderTag.tagName === 'TABLE') {
            // Get table data
            chartDataStore[index]['header'] = getTableData('header', params[index], placeholderName);
            chartDataStore[index]['data'] = getTableData('rows', params[index], placeholderName);
            
            /**
            * Wrap chart in figure with caption
            */
            var tableCaption = $('table#' + placeholderName + ' caption').text();
            var tableContext = getTableData('context', params[index], placeholderName);
            $(this).wrap("<figure></figure>");
            $(this).before("<figcaption>" + placeholderFigCaption + tableCaption + " (" + tableContext + ")</figcaption>");
            
            if(chartDataStore[index]['category'] != undefined) {
                buildRadioArray(index);
            }

            buildCheckBoxArray(index);
            buildChart(chartDataStore[index], index);
        } 
        else if(placeholderTag.tagName === 'A') {
            var headerName = params[index]["header"],
                columnName = params[index]["column_name"],
                excludeRow = params[index]["exclude_row"],
                excludeColumn = params[index]["exclude_column"];

            d3.csv(placeholderTag.attributes.href.nodeValue, function(data) {
                chartDataStore[index]['header'] = [];
                chartDataStore[index]['data'] = [];
                chartDataStore[index]['category'] = [];
                
                data = data.filter(exclude);
                
                function exclude(array) {
                    return array[headerName] != excludeRow;
                }

                /**
                *  @todo Personalize the content depending on the CSV file
                */
                data.forEach(function (d, i) {
                    chartDataStore[index]['header'].push(d[headerName]);
                    var keys = Object.keys(d);
                    for (var j = 0; j < keys.length; j++) {
                        var e = keys[j];

                        if(e !== headerName && columnName == undefined) {
                            if(i == 0) {
                                chartDataStore[index]['category'].push(e);
                                chartDataStore[index]['data'].push([]);
                            }
                            chartDataStore[index]['data'][j-1].push(d[e]);

                        } else if(e == columnName) {
                            if(i == 0) {
                                chartDataStore[index]['category'].push(e);
                                chartDataStore[index]['data'].push([]);
                            }
                            chartDataStore[index]['data'][0].push(d[e]);
                        }
                    }
                });

                if(columnName == undefined) {
                    buildRadioArray(index);
                }
                buildCheckBoxArray(index);
                buildChart(data, index, placeholderName, formatOption);
            })               
            /**
            * Wrap chart in figure with caption
            */
            if ($.inArray('d3-pie', classArray[index]) > 0 || $.inArray('d3-bar', classArray[index]) > 0) {
                $(this).wrap("<figure class='" + classArray[index][1] + "-fig'></figure>");
            }

            if(columnName != undefined) {
                var csvCaption = $('#' + placeholderName + '').attr('title');
        
                if(csvCaption != undefined && csvCaption != "") {
                    if ($.inArray('d3-pie', classArray[index]) > 0 || $.inArray('d3-bar', classArray[index]) > 0) {
                        $(this).before("<figcaption>" + placeholderFigCaption + csvCaption + " (" + columnName + ")</figcaption>");
                    }
                }
            }
        }
    });
    
    /**
     * Set the format of the numbers
     * @see https://github.com/d3/d3-3.x-api-reference/blob/master/Formatting.md#d3_format
     * @see https://github.com/d3/d3-3.x-api-reference/blob/master/Localization.md#d3_locale
     * 
     */
    function setFormat(index) {
        placeholderFormat = params[index]['format'],
        format = placeholderFormat;

        if (placeholderFormat == undefined) {
            format = "$,";
        }

        return format;
    }

    function buildRadioArray(index) {
        /**
        * Build Radio array
        */
        var formatOption = setFormat(index);
        var column = chartDataStore[index]['category'][0];

        if(index == 0) {
            $(".d3-filters").addClass("row");
            $(".d3-filters").append("<div class='form-group chart-radio chart-radio-filters col-md-3 col-sm-4'></div>");
            if(lang == "en") {
                $(".chart-radio").html("<p><strong>Select a category</strong></p><ul class='chart-radio-container list-unstyled'></ul>");
            } else if (lang == "fr") {
                $(".chart-radio").html("<p><strong>Sélectionner une catégorie</strong></p><ul class='chart-radio-container list-unstyled'></ul>");
            }
        }
        
        if ($.inArray('d3-pie', classArray[index]) > 0) {
            // $(".d3-filters").append("<div class='form-group chart-radio chart-radio-filters filter-radio-chart-" + index + "'></div>");
            $('.chart-radio-container').addClass("filter-radio-chart-" + index + "");
        }
        else if ($.inArray('d3-bar', classArray[index]) > 0) {
            // $(".d3-filters").append("<div class='col-sm-4 form-group chart-radio chart-radio-filters filter-radio-chart-" + index + "'></div>");
            $('.chart-radio-container').addClass("filter-radio-chart-" + index + "");
        }
        
        if(index == 0) {
            $.each(chartDataStore[index]['category'], function(key, value) {
                var radioLabel = value;
                var radioValue = value;
                var radioName = 'chart[' + index + ']';
                if(value == column) {
                    var radioTemplate = '<li><div class="radio"><label><input data-chart="' + index + '" data-index="' + key + '" type="radio" name="' + radioName + '" value="' + radioValue + '" checked>' + radioLabel + "</label></div></div></li>";
                } else {
                    var radioTemplate = '<li><div class="radio"><label><input data-chart="' + index + '" data-index="' + key + '" type="radio" name="' + radioName + '" value="' + radioValue + '">' + radioLabel + "</label></div></div></li>";
                }
                
                $(".filter-radio-chart-" + index).append(radioTemplate);
            });
        }
        
        /**
        * Filter charts based on checkbox interaction
        */
        // $('.chart-radio-filters').each(function(index, element) {
            // $(this).find(':radio').change(function() {
            $('.chart-radio-filters').find(':radio').change(function() {
                // var chartRef = $(this).data("chart");
                var chartRef = index
                var i = $(this).data("index");
                var newChartData = manipulateRadioChartData(chartRef, i);

                if ($.inArray('d3-pie', classArray[index]) > 0) {
                    changePieData(plotPieData(newChartData['header'], newChartData['data']), chartRef, formatOption);
                }
                else if ($.inArray('d3-bar', classArray[index]) > 0) {
                    changeBarData(newChartData['header'], newChartData['data'], chartRef, formatOption);
                }
            });
        // });
    }
    
    function buildCheckBoxArray(index) {
        /**
        * Build checkbox array
        */
        var formatOption = setFormat(index);
        var headerName = params[index]["header"];

       if(index == 0) {
           $(".d3-filters").append("<div class='form-group chart-checkbox chart-checkbox-filters col-md-9 col-sm-8'></div>");

           if(headerName != undefined) {
               if(lang == "en") {
                   $(".chart-checkbox").html("<p><strong>Select the " + headerName + "</strong></p><ul class='chart-checkbox-container list-unstyled colcount-md-3 colcount-sm-2'></ul>");
                } else if(lang == "fr") {
                    $(".chart-checkbox").html("<p><strong>Choisir un/une " + headerName + "</strong></p><ul class='chart-checkbox-container list-unstyled colcount-md-3 colcount-sm-2'></ul>");
               }
           }
       }

        if ($.inArray('d3-pie', classArray[index]) > 0) {
            // $(".d3-filters").append("<div class='form-group chart-checkbox chart-checkbox-filters filter-checkbox-chart-" + index + "'></div>");
            $(".chart-checkbox-container").addClass("filter-checkbox-chart-" + index + "");
        }
        else if ($.inArray('d3-bar', classArray[index]) > 0) {
            // $(".d3-filters").append("<div class='form-group chart-checkbox chart-checkbox-filters filter-checkbox-chart-" + index + "'></div>");
            $(".chart-checkbox-container").addClass("filter-checkbox-chart-" + index + "");
        }
        
        if (index == 0) {
            $.each( chartDataStore[index]['header'], function(key, value) {
                var checkboxLabel = value;
                var checkboxValue = value;
                var checkboxName = 'chart[' + index + '][' + key + ']';
                var checkboxTemplate = '<li class="mrgn-tp-0 mrgn-bttm-sm"><div class="checkbox mrgn-tp-0 mrgn-bttm-0"><label><input data-chart="' + index + '" data-index="' + key + '" type="checkbox" name="' + checkboxName + '" value="' + checkboxValue + '" checked>' + checkboxLabel + "</label></div></li>";
                
                $(".filter-checkbox-chart-" + index).append(checkboxTemplate);
            });
        }
        
        /**
        * Filter charts based on checkbox interaction
        */


        // $('.chart-checkbox-filters').each( function(i, element) {
            // $(this).find(':checkbox').change(function() {
            $('.chart-checkbox-filters').find(':checkbox').change(function() {
                // var chartRef = $(this).data("chart");
                var chartRef = index;
                var newChartData = manipulateChartData(chartRef);

                if ($.inArray('d3-pie', classArray[index]) > 0) {
                    changePieData(plotPieData(newChartData['header'], newChartData['data']), chartRef, formatOption);
                }
                else if ($.inArray('d3-bar', classArray[index]) > 0) {
                    changeBarData(newChartData['header'], newChartData['data'], chartRef, formatOption);
                }
            });
        // });
    }
    
    /**
    * Helper function to manipulate chart data with checkbox input
    */
    function manipulateChartData(chartRef) {
        var chartDataHeader = chartDataStore[chartRef]['header'].slice(0);
        var chartDataRow = chartDataStore[chartRef]['data'][0].slice(0);
        var newHeader = [];
        var newRowData = [];
        var chartCheckboxRef = $(".filter-checkbox-chart-" + chartRef).find(':checkbox');

        var i = 0;
        
        $.each( chartCheckboxRef, function(key, value) {
            var checkboxInstance = $(this).data("index");
            if (this.checked) {
                newHeader[i] = chartDataHeader[key];
                newRowData[i] = chartDataRow[key];
                i++;
            }
        });
        
        var newData = [];
        newData['header'] = newHeader;
        newData['data'] = newRowData;

        return newData;
    }
    
    /**
    * Helper function to manipulate chart data with radio input
    */
    function manipulateRadioChartData(chartRef, ind) {
        var chartDataHeader = chartDataStore[chartRef]['header'].slice(0);
        var chartDataRow = chartDataStore[chartRef]['data'][ind].slice(0);
        var chartDataCategory = chartDataStore[chartRef]['category'].slice(0);
        var newHeader = [];
        var newRowData = [];

        var chartCheckboxRef = $(".filter-checkbox-chart-" + chartRef).find(':checkbox');
        var i = 0;
        
        $.each( chartCheckboxRef, function(key, value) {
            if (this.checked) {
                newHeader[i] = chartDataHeader[key];
                newRowData[i] = chartDataRow[key];
                i++;
            }
        });
        
        var newData = [];
        newData['header'] = newHeader;
        newData['category'] = chartDataCategory;
        newData['data'] = newRowData;

        return newData;
    }
    
    /**
    * Function to build the chart
    */
    function buildChart(data, index, placeholderName, formatOption) {
        var format = locale.numberFormat(formatOption);

        /**
        * Init D3 pie chart
        */
        if ($.inArray('d3-pie', classArray[index]) > 0) {
            var width = 960,
                height = 960,
                radius = Math.min(width, height) / 2;
        
            svg[index] = d3.select("#" + placeholderId[index])
                .append("div")
                .attr({class: 'row'})
                .append("div")
                .attr({class: 'col-md-6'})
                .append("svg")
                // .attr({class: 'd3-svg', width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', viewBox: '0 0 ' + (width / 4) + ' ' + (height / 4) + ''})
                .attr({class: 'd3-svg', width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', viewBox: '0 0 ' + 200 + ' ' + 200 + ''})
                .append("g");
            svg[index].append("g")
                .attr("class", "slices");
            svg[index].append("g")
                .attr("class", "labels");
            svg[index].append("g")
                .attr("class", "lines");
            svg[index].append("g").attr({["aria-label"]: "Total", class: "total"});
            svg[index].attr("transform", "translate(100,100)");

            legendSvg[index] = d3.select("#" + placeholderId[index])
                .selectAll('.row')
                .append("div")
                .attr({class: 'col-md-6'})
                //.append("svg")
                //.attr({class: 'd3-legend', width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', viewBox: '0 0 ' + (width / 4) + ' ' + 280 + ''})
                // .attr({class: 'd3-legend', width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', viewBox: '0 0 ' + 200 + ' ' + 200 + ''})
                .append("div")
				.attr({class: 'd3-legend'});
				//.append("g")
                //.attr("transform", "translate(0,100)");

            //legendSvg[index].append("g")
			legendSvg[index].append("div")
                //.attr({["aria-label"]: "Legend", class: "legend", transform: "translate(0,15)"});
				.attr({["aria-label"]: "Legend", class: "legend"});

            changePieData(plotPieData(chartDataStore[index]['header'], chartDataStore[index]['data'][0]), index, formatOption);
        }
        /**
        * Init D3 bar chart
        */
        else if ($.inArray('d3-bar', classArray[index]) > 0) {
            var chartHeader = chartDataStore[index]['header'];
            var chartData = chartDataStore[index]['data'][0];

            var margin = {top: 30, right: 10, bottom: 80, left: 125}
            
            var height = 700 - margin.top - margin.bottom,
                width = 1140 - margin.left - margin.right,
                barWidth = 65;
            
            svg[index] = d3.select("#" + placeholderId[index])
                .append('svg')
                .attr({width: (width + margin.left + margin.right), height: (height + margin.top + margin.bottom)})
                // .attr('preserveAspectRatio', 'xMinYMin meet')
                // .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
            svg[index].append('g')
                .attr("class", "grid-x");
            svg[index].append('g')
                .attr("class", "grid-y");
            svg[index].append('g')
                .attr("class", "bars")
                .attr('transform', 'translate(' + margin.left + ', ' + (margin.top) + ')');
            
            changeBarData(chartHeader, chartData, index, formatOption);
        }
        /**
        * Init D3 Table chart
        */
        else if ($.inArray('d3-table', classArray[index]) > 0) {
            var csvCaption = $('#' + placeholderName + '').attr('title');
            
            var table = d3.select('.d3-table')
                .append('table')
                .attr("class", "wb-tables table table-striped table-hover")
                .attr("data-wb-tables", "{ \"ordering\" : false }");

            if(csvCaption != undefined && csvCaption != "") {
                table.append('caption').text(csvCaption)
            }
            
            var titles = d3.keys(data[0]);
            var titlesData = [];
            
            for (i = 0; i < titles.length; i++) {
                titlesData.push(titles[i]);
            }
            
            var headers = table.append('thead')
                .append('tr')
                .selectAll('th')
                .data(titlesData).enter()
                .append('th')
                .attr("scope", "col")
                .text(function (d) {
                    return d;
                });
            
            var rows = table.append('tbody')
                .selectAll('tr')
                .data(data).enter()
                .append('tr');

            var rowsHeader = rows.selectAll('th')
                .data(function(d) {
                    return [d[params[index]['header']]];
                })
                .enter()
                .append('th')
                .attr('scope', 'row')
                .text(function(d) {
                    return d;
                })

            var rowsCells = rows.selectAll('td')
                .data(function (d) {
                    return titlesData.filter(function(col) { return col != params[index]['header']}).map(function (k) {
                        return { 'value': d[k], 'name': k};
                    });
                }).enter()
                .append('td')
                // .attr('data-th', function (d) {
                //     return d.name;
                // })
                .text(function (d) {
                    if(d.name != params[index]['header']) {
                        return format(d.value);
                    } else {
                        return d.value;
                    }
                });

        }
    }
    
    /**
    * Change data used in bar chart.
    */
    function changeBarData(chartHeader, chartData, instance, formatOption) {
        /**
        * Wrap chart in figure with caption
        */
       var placeholderName = $(".d3-bar").attr('data-name');
       var placeholderFigCaption = "";
    //    var placeholderFigCaption = lang == 'en' ? "Bar Chart for " : "Diagramme à bandes pour ";

       if(document.getElementById(placeholderName).tagName === "A" && params[instance]['column_name'] == undefined) {
           d3.select(".d3-bar-fig").selectAll("figcaption").remove();
           var currentCategory = document.querySelector('input[type="radio"]:checked').value;
   
           var csvCaption = $('#' + placeholderName + '').attr('title');
   
           if(csvCaption != undefined && csvCaption != "") {
               d3.select(".d3-bar-fig").insert("figcaption", ":first-child").text(placeholderFigCaption + csvCaption + " (" + currentCategory + ")");
           }
       }

        /**
         * Add the possibility to format the numbers
         */
        var format = locale.numberFormat(formatOption)

        /**
         * Start of the graphic
         */
        var margin = {top: 30, right: 10, bottom: 80, left: 125}
        
        var height = 700 - margin.top - margin.bottom,
            width = 1140 - margin.left - margin.right;
        
        var yScale = d3.scale.linear()
            .domain([0, Math.max.apply(Math, chartData)])
            .range([0, height])
        
        var xScale = d3.scale.ordinal()
            .domain(d3.range(0, chartData.length))
            .rangeBands([0, width])
        
        var xScaleDomain = d3.scale.ordinal()
            .domain(chartHeader)
            .rangeBands([0, width]);
            
        var barWidth = xScale.rangeBand() - 5;
        
        /**
        * @todo Check if we can use multiple color with patterns
        */
        var colors = d3.scale.linear()
            .domain([0, chartData.length * .33, chartData.length * .66, chartData.length])
            .range(['#d6e9c6', '#bce8f1', '#faebcc', '#ebccd1'])

        /**
         * Transition used for Object Constancy :
         * @see https://bost.ocks.org/mike/constancy/
         */
        
        var chart = svg[instance].select(".bars");

        var bars = chart.selectAll('.bar').data(chartData);
        var barsEnter = bars.enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', function(d, i) {
                return 'translate(' + xScale(i) + ', ' + (height - yScale(d)) + ')';
            })
            .style("fill-opacity", 0);

        
        barsEnter.append('rect')
            .style('fill', '#69b3a2')
            .attr('width', barWidth)
            .attr('height', function (d) {
                return yScale(d);
            })
        
        barsEnter
            .append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", "13px")
            .attr("x", barWidth / 2)
            .attr("y", "-5")
            .text(function(d) { 
                return format(d); 
            });

        var barsUpdate = bars
            .transition().duration(750)
            .attr('transform', function(d, i) {
                return 'translate(' + xScale(i) + ', ' + (height - yScale(d)) + ')';
            })
            .style("fill-opacity", 1);
        
        barsUpdate.select('rect')
            .attr('width', barWidth)
            .attr('height', function (d) {
                return yScale(d);
            })
        
        barsUpdate.select('text')
            .attr("x", barWidth / 2)
            .text(function(d) { 
                return format(d); 
            });

        var barExit = bars.exit()
            .transition().duration(750)
            .style("fill-opacity", 0)
            .remove();

        barExit.select("rect")
            .attr('width', barWidth)
            .attr('height', function (d) {
                return yScale(d);
            })
      
        barExit.select("text")
            .attr("x", barWidth / 2)
            .text(function(d) { 
                return format(d); 
            });

        var verticalGuideScale = d3.scale.linear()
            .domain([0, Math.max.apply(Math, chartData)])
            .range([height, 0])
        
        var vAxis = d3.svg.axis()
            .scale(verticalGuideScale)
            .orient('left')
            .tickFormat(locale.numberFormat(formatOption))
            .ticks(10)
        
        var verticalGuide = svg[instance].select(".grid-y").transition().duration(750);
        vAxis(verticalGuide)
        svg[instance].select(".grid-y").attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
        verticalGuide.selectAll('path')
            .style({fill: 'none', stroke: "#000"})
        verticalGuide.selectAll('line')
            .style({stroke: "#000"})
        
        var hAxis = d3.svg.axis()
            .scale(xScaleDomain)
            .orient('bottom')
            .ticks(chartData.size)
        
        var horizontalGuide = svg[instance].select(".grid-x").transition().duration(750);
        hAxis(horizontalGuide)
        svg[instance].select(".grid-x").attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')')
        horizontalGuide.selectAll('path')
            .style({fill: 'none', stroke: "#000"})
        horizontalGuide.selectAll('line')
            .style({stroke: "#000"});
        
        // Rotate X axis labels
        svg[instance].select(".grid-x").selectAll(".tick text")
            .attr("font-size", "13px")
            .call(wrap, xScale.rangeBand());

        // Axis titles
        var gridYremove = svg[instance].select(".grid-y").selectAll(".title").remove();
        var gridXremove = svg[instance].select(".grid-x").selectAll(".title").remove();
        
        var gridX = svg[instance].select(".grid-x");
        gridX.append("text")
            .attr("class", "title")
            .attr("text-anchor", "end")
            .attr("x", width / 2)
            .attr("y", 70)
            .text(params[instance]['axis_x_title']);
        
        var gridY = svg[instance].select(".grid-y")
        
        gridY.selectAll(".tick text")
            .attr("font-size", "13px")
        
        gridY.append("text")
            .attr("class", "title")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -height / 2)
            .text(params[instance]['axis_y_title'])

        /** Testing this code:
        * @see https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
        */
        // d3.select("#" + placeholderId[instance]).selectAll('.tooltip').remove();

        // var tooltips = d3.select("#" + placeholderId[instance])
        //     .style("position", "relative")
        //     .append("div")
        //     .attr('class', 'tooltip')
        //     .style("background-color", "white")
        //     .style("border", "solid")
        //     .style("border-width", "1px")
        //     .style("border-radius", "5px")
        //     .style("padding", "5px")

        // // Three function that change the tooltip when user hover / move / leave a cell
        // var mouseover = function(d) {
        //     tooltips
        //         .style("opacity", 1)
        // }

        // var mousemove = function(d, i) {
        //     tooltips
        //         .html(chartHeader[i] + ' (' + format(d) + ')')
        //         .style("left", Math.max(0, d3.event.layerX) + "px")
        //         .style("top", (d3.event.layerY - 40) + "px");
        // }
        // var mouseleave = function(d) {
        //     tooltips
        //         .style("opacity", 0)
        // }3

        // barsEnter
        //     .on("mouseover", mouseover)
        //     .on("mousemove", mousemove)
        //     .on("mouseleave", mouseleave)

        barsEnter.select('rect')
            .on('mouseover', function (d) {
                d3.select(this)
                .style('fill', '#DE7552')
            })
            .on('mouseout', function (d) {
                d3.select(this)
                .style('fill', '#69b3a2')
            });

    }
    /**
    * Prepare table data for plotting.
    */
    function plotPieData(header, data){
        return header.map(function(label, i) {
            return { label: label, value: data[i] }
        });
    }
    /**
    * Change data used in pie chart.
    */
    function changePieData(data, instance, formatOption) {
        /**
        * Wrap chart in figure with caption
        */
        var placeholderName = $(".d3-pie").attr('data-name');
        // var placeholderFigCaption = lang == 'en' ? "Donut Chart for " : "Graphique en anneau pour ";
       var placeholderFigCaption = "";


         if(document.getElementById(placeholderName).tagName === "A" && params[instance]['column_name'] == undefined) {
             d3.select(".d3-pie-fig").selectAll("figcaption").remove();
             var currentCategory = document.querySelector('input[type="radio"]:checked').value;
     
             var csvCaption = $('#' + placeholderName + '').attr('title');
     
             if(csvCaption != undefined && csvCaption != "") {
                 d3.select(".d3-pie-fig").insert("figcaption", ":first-child").text(placeholderFigCaption + csvCaption + " (" + currentCategory + ")");
             }
         }
 
         /**
          * Add the possibility to format the numbers
          */
        var format = locale.numberFormat(formatOption)

        /**
         * Start of the graphic
         */
        var width = 250,
            height = 250,
            radius = Math.min(width, height) / 2;
        
        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) {
                return d.value;
            });

        var palette14 = [
            "url(#circle-1)", "#ffd700", 
            "url(#dots-1)", "#ffb14e", 
            "url(#horizontal-stripe-1)", "#fa8775", 
            "url(#diagonal-stripe-1)", "#ea5f94",
            "url(#diagonal-stripe-2)", "#cd34b5",
            "url(#vertical-stripe-1)", "#9d02d7", 
            "url(#crosshatch-1)", "#0000ff"
        ]

        var palette15 = [
            "url(#circle-2)", "#ff0000",
            "#ffa500", "#ffff00",
            "url(#horizontal-stripe-2)", "#800080",
            "#ff00ff", "#00ff00",
            "url(#crosshatch-2)", "url(#vertical-stripe-2)",
            "#0000ff", "#00ffff",
            "#008080", "#c0c0c0",
            "url(#diagonal-stripe-3)"
        ]

        var colour = palette14;

        if(params[instance]['colour'] == "palette-15") {
            colour = palette15;
        }

        var color = d3.scale.ordinal()
            .domain(chartDataStore[instance]['header'])
            .range(colour);
            // .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
        
        var arc = d3.svg.arc()
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.4);
        
        var outerArc = d3.svg.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);
        
        var showLabels = params[instance]['labels'];
        var slice = svg[instance].select(".slices").selectAll("path.slice");
        
        // Pie slices
        var data0 = slice.data(),
            data1 = pie(data);
        
        // We are creating the slice to the path
        /** 
        * @todo: Add the data for one using screen reader, either on the path or legend (to see with Robin) 
        */
        slice = slice.data(data1, key);
        
        slice.enter()
            .append("path")
            .each(function (d, i) { 
                this._current = findNeighborArc(i, data0, data1, key) || d; 
            })
            .attr({fill: function (d) { return color(d.data.label); }})
            .append("title")
            .text(function (d) { return d.data.label; });
        
        slice
            .transition()
            .duration(750)
            .attrTween("d", function(d) {
                var i = d3.interpolate(this._current, d);
                this._current = i(0);
                return function (t) { return arc(i(t)); };
            })
        
        slice.exit()
            .remove()
        
        /**
        * Show the total of each selected box in the middle of the donut
        */
        var total = 0;
        for (var i = 0; i < data.length; i++) {
            total += parseInt(data[i].value);
        }
        
        var showTotal = svg[instance].select(".total");
        
        showTotal.append("text")
            .attr({dy: "0.35em", ["text-anchor"]: "middle"})
            .text(format(total))
            .style({fill: "black", opacity: 1, ["font-size"]: 12});
        
        
        showTotal.selectAll("text")
            .each(function(d, i) {
                if(i > 0) {
                    showTotal.select("text").remove();
                }
            });
        
        if ((showLabels === 'false') || (typeof showLabels === 'undefined')) {
            // Make slices hoverable
            slice
                .attr("class", "slice slice-hover")
            
            // Do not show labels, add title element instead
            // var tooltips = svg[instance].selectAll("path")
            //     .append("title")
            //     .classed("tooltip", true)
            //     .text(function(d) {
            //         return d.data.label + ' (' + d.data.value + ')';
            //     });
            
            /** Testing this code:
            * @see https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
            */
            d3.select("#" + placeholderId[instance]).selectAll('.tooltip').remove();

            var tooltips = d3.select("#" + placeholderId[instance])
                .style("position", "relative")
                .append("div")
                .attr('class', 'tooltip')
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "1px")
                .style("border-radius", "5px")
                .style("padding", "5px")
            
            // Three function that change the tooltip when user hover / move / leave a cell
            var mouseover = function(d) {
                tooltips
                    .style("opacity", 1)
            }
            
            var mousemove = function(d) {
                tooltips
                    .html(d.data.label + ' ' + format(d.value) + '')
                    .style("left", Math.max(0, d3.event.layerX) + "px")
                    .style("top", (d3.event.layerY - 40) + "px");
            }
            var mouseleave = function(d) {
                tooltips
                    .style("opacity", 0)
            }
            
            slice
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
            
            // We remove the current "legend-entry, to update for the newest one"
            // svg[instance].select(".legend").selectAll(".legend-entry").remove();
            legendSvg[instance].select(".legend").selectAll(".legend-entry").remove();

            // Build legend
            // chartLegend[instance] = svg[instance].select(".legend").selectAll(".legend-entry")
            chartLegend[instance] = legendSvg[instance].select(".legend").selectAll(".legend-entry")
                .data(pie(data), key)
                .enter().append("div")
				//.attr({width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', viewBox: '0 0 ' + 220 + ' ' + 15 + ''})
                /*.attr("transform", function(d, i){
                    return "translate(" + 0 + "," + (i * 20 - (height / 2) + 15) + ")";
                })*/
                .attr({class: "legend-entry"});
            
            chartLegend[instance]
				.append("svg")
				.attr({width: 20, height: 20, class: "legend-color"})
				.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", function(d) {
                    return color(d.data.label);
                });
            
            chartLegend[instance].append("p")
                .text(function(d){
                    return d.data.label + " " + format(d.data.value);
                })
                //.style("font-size", 10)
                //.attr("y", 11)
                //.attr("x", 17);
        }
        else {
            // Show labels
            var text = svg[instance].select(".labels").selectAll("text")
                .data(pie(data), key);
            
            text.enter()
                .append("text")
                .attr("dy", ".35em")
                .text(function(d) {
                    return d.data.label + ' (' + d.data.value + ')';
                });
            
            text.transition().duration(1000)
                .attrTween("transform", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                        return "translate("+ pos +")";
                    };
                })
                .styleTween("text-anchor", function(d){
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        return midAngle(d2) < Math.PI ? "start" : "end";
                    };
                });
            
            text.exit().remove();
            
            // Slice to text ploylines
            var polyline = svg[instance].select(".lines").selectAll("polyline")
                .data(pie(data), key);
            
            polyline.enter()
                .append("polyline");
            
            polyline.transition().duration(1000)
                .attrTween("points", function(d){
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                        return [arc.centroid(d2), outerArc.centroid(d2), pos];
                    };
                });
            
            polyline.exit().remove();
        }
    }
    /**
    * Helper function to get table data.
    */
    function getTableData(scope, params, placeholderName) {
        var type = params['plot_type'];
        var row = params['row'];
        var column = params['column'];
        var excludeColumn = params['exclude_column'];
        var excludeRow = params['exclude_row'];
        
        if (scope == 'header') {
            var tableHeaderData = [];
            
            $("table#" + placeholderName).each(function() {
                // Header
                var tableDataArray = [];
                
                if (type == 'row') {
                    var tableHeader = $(this).find('thead th').not(':first').not(':eq(' + excludeColumn + ')');
                }
                else if (type == 'column') {
                    var tableHeader = $(this).find('tbody tr').not(':nth-child(' + excludeRow + ')').find('.header');
                }
                
                if (tableHeader.length > 0) {
                    tableHeader.each(function() {
                        tableDataArray.push($(this).text());
                    });
                    tableHeaderData.push(tableDataArray);
                }
            });
            
            return tableHeaderData[0];
        }
        else if (scope == 'rows') {
            var rowTableData = [];
            
            $("table#" + placeholderName).each(function() {
                // Body
                var tableDataArray = [];
                
                if (type == 'row') {
                    var tableData = $(this).find('tr:nth-child(' + row + ') td').not(':eq(' + excludeColumn + ')');
                }
                else if (type == 'column') {
                    var tableData = $(this).find('tr').not(':eq(' + excludeRow + ')').find('td:nth-child(' + column + ')');
                }
                
                if (tableData.length > 0) {
                    tableData.each(function() {
                        tableDataArray.push($(this).text());
                    });
                    rowTableData.push(tableDataArray);
                }
            });
            
            return rowTableData;
        }
        else if (scope == 'context') {
            // Context
            var tableContext = '';
            
            $("table#" + placeholderName).each(function() {
                if (type == 'row') {
                    tableContext = $(this).find('tbody tr:nth-child(' + row + ')').find('.header').text();
                }
                else if (type == 'column') {
                    tableContext = $(this).find('thead th:nth-child(' + column + ')').text();
                }
            });
            
            return tableContext;
        }
    }
    /**
     * Next fours fuctions are to animate and join the donut chart, as followed here:
     * @see https://bl.ocks.org/mbostock/5682158
     */
    function key(d) {
        return d.data.label; 
    }
    
    function findNeighborArc(i, data0, data1, key) {
        var d;
        return (d = findPreceding(i, data0, data1, key)) ? { startAngle: d.endAngle, endAngle: d.endAngle }
        : (d = findFollowing(i, data0, data1, key)) ? { startAngle: d.startAngle, endAngle: d.startAngle }
        : null;
    }
    
    // Find the element in data0 that joins the highest preceding element in data1.
    function findPreceding(i, data0, data1, key) {
        var m = data0.length;
        while (--i >= 0) {
            var k = key(data1[i]);
            for (var j = 0; j < m; ++j) {
                if (key(data0[j]) === k) return data0[j];
            }
        }
    }
    
    // Find the element in data0 that joins the lowest following element in data1.
    function findFollowing(i, data0, data1, key) {
        var n = data1.length, m = data0.length;
        while (++i < n) {
            var k = key(data1[i]);
            for (var j = 0; j < m; ++j) {
                if (key(data0[j]) === k) return data0[j];
            }
        }
    }
    
    function midAngle(d){
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }
    
    /**
    * Function to wrap axis labels to fit in multiple lines
    * @see https://bl.ocks.org/mbostock/7555321 
    */
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/[\s-]+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
    /**
    * Function to create pattern directly into JS
    * To create the patterns, I took example of this:
    * @see https://iros.github.io/patternfills/sample_d3.html
    * @see https://iros.github.io/patternfills/
    */
    function createPattern(id, type, colorRect, colorType, weight = 1, width = 10, height = 10) {
        var typeAttr;
        
        if(type == "dots") {
            type = "rect";
            typeAttr = {width: 1 * weight, height: 1 * weight, fill: colorType};
        } else if(type == "horizontal-stripe") {
            type = "rect";
            typeAttr = {width: 1 * weight, height: 10, fill: colorType};
        } else if(type == "diagonal-stripe") {
            type = "path";
            typeAttr = {d: "M-1,1 l2,-2  M0,10 l10,-10 M9,11 l2,-2", stroke: colorType, ["stroke-width"]: 1 * weight };
        } else if(type == "vertical-stripe") {
            type = "rect";
            typeAttr = {width: 10, height: 1 * weight, fill: colorType};
        } else if(type == "circle") {
            typeAttr = {cx: 1 * weight, cy: 1 * weight, r: 1 * weight, fill: colorType};
        } else if(type == "crosshatch") {
            type = "path";
            typeAttr = {d: "M0 0L8 8ZM8 0L0 8Z", stroke: colorType, ["stroke-width"]: 1 * weight };
        }
        
        var pattern = d3.select(".d3-pattern")
            .append("svg")
            .attr({width: width, height: height, version: "1.1", xmlns: "http://www.w3.org/2000/svg"})
            .append("defs")
            .append("pattern")
            .attr({id: id, width: width, height: height, patternUnits: "userSpaceOnUse"});
        
        pattern.append("rect")
            .attr({width: width, height: height, fill: colorRect});
        
        pattern.append(type)
            .attr(typeAttr);
    }
})(jQuery);
