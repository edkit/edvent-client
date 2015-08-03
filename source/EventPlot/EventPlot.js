
enyo.kind({
    name: "edvent.EventPlot",
    kind: enyo.Control,

    published: {
      data: undefined,
    },

    plot: function() {

        var offsetTop = this.container.node.offsetTop;
        var offsetLeft = this.container.node.offsetLeft;

        var margin = {top: 20, right: 20, bottom: 30, left: 80},
        width = this.container.node.offsetWidth - margin.left - margin.right;
        height = this.container.node.offsetHeight - margin.top - margin.bottom;

        var x = d3.scale.linear()
            .range([0, width]);


        var yList = [];
        var colorList = [];
        var heightList = [];

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = function(datum, index) {
            var axis = d3.svg.axis()
                .scale(yList[index])
                .orient("left");

            d3.select(this)
                .call(axis);
        };


        // tooltips container
        var div = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0.1);

        // data
        data = this.data;
        var index=0;
        data.forEach(function(d) {
            d.index = index++;
        });

        var class_list = d3.nest()
          .key(function(d) { return d.class; })
          .entries(data);

        class_list.forEach( function(s, index) {
            s.class_index = index;
            // add class index to each entries
            s.values.forEach(function(e) {
                e.class_index = index;
            });

            // one color domain per class
            colorList[index] = d3.scale.category10();
            colorList[index].domain(s.values.filter(function(e, pos) { return s.values.indexOf(e) == pos; })
                .map(function(e) {
                    return e.obj;
                })
            );

            // one height per class
            var eventList = d3.nest()
                .key(function(d) { return d.evt; })
                .entries(s.values);

            heightList[index] = eventList.length * 20;

            // one y domain per class
            yList[index] = d3.scale.ordinal();
            yList[index].domain(s.values.map(function(o) { return o.evt}))
                .rangePoints([heightList[index], 0]);

        });

        //svg containers
        var svg = d3.select("#" + this.id).selectAll("svg")
            .data(class_list)
            .enter().append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", function(d, index) {
                    return heightList[index] + margin.top + margin.bottom;
                })
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");  

        x.domain(d3.extent(data, function(d) { return d.index; })).nice();

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", function(d, index) { 
                    return "translate(0," + heightList[index] + ")";
            })
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .each(yAxis);

        svg.append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(function(d, index) { return class_list[index].key;});

        // scatter plot
        svg.selectAll(".dot")
        .data(function(d) { return d.values; })
        .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.index); })
            .attr("cy", function(d) { return yList[d.class_index](d.evt); })
            .style("fill", function(d) { return colorList[d.class_index](d.obj); })

            // Tooltip stuff after this
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)	
                .style("opacity", .9);	

            div.html("timestamp: " + d.t + "<br/>" +
                    "event: " + d.evt + "<br/>" +
                    "data: " + d.data.replace(",", "<br/>") + "<br/>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })

        // lines
        var line = d3.svg.line()
            .interpolate("step-after")
            .x(function(d) { return x(d.index); })
            .y(function(d) { return yList[d.class_index](d.evt); });

        var objects = function(d, index) {
            return colorList[index].domain().map(function(obj) {
                return {
                    obj: obj,
                    class_index : index,
                    values: d.values.filter(function(e) {
                    return e.obj == obj;
                    })
                };
            });
        };

        var object = svg.selectAll(".object")
            .data(objects)
            .enter().append("g")
            .attr("class", "object");

        object.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.values); })
            .style("stroke", function(d) { 
                    return colorList[d.class_index](d.obj); 
                    });
    }


});
