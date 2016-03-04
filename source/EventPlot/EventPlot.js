
enyo.kind({
    name: "edvent.EventPlot",
    kind: enyo.Control,

    published: {
      data: undefined
    },

    components : [
        { tag : "div", name : "context"},
        { tag : "div", name : "focus"}
    ],
    tooltipView: undefined,

    create: function() {
           this.inherited(arguments);
           this.tooltipView = new edvent.InfoView();
       },

    objectList: [],
    childList: [],
    eventList: [],
    classData: [],
    filteredData: [],

    svg: undefined,
    scatter: undefined,
    line: undefined,
    x: undefined,
    yList: [],
    colorList: [],

    dataChanged: function(inOldValue) {
        var data = this.data;
        // build object list
        objectList = [];
        data.forEach(function(entry) {
            var obj = {"class": entry.class,
                "obj": entry.obj};
            var objExists = objectList.filter(function ( o ) {
                return o.class === obj.class && o.obj === obj.obj;
            })[0];

            if(objExists == undefined) {
                objectList.push(obj);
            }
        });

        // build child list
        /* The current link API considers that the child id is unique in the
            logs. This must evolve to correctly handled distributed use-cases
            and non-pointer ids
        */
        childList = [];
        data.forEach(function(entry) {
            if(entry.type == "link") {
                var obj = this.objectList.filter(function ( o ) {
                    return o.class === entry.class && o.obj === entry.obj;
                })[0];

                var childObj = this.objectList.filter(function ( o ) {
                    return o.obj === entry.data_in.child;
                })[0];

                childList.push({
                    "parent": obj,
                    "child": childObj
                });
            }
        });

        // todo : build event list

        this.objectList = objectList;
        this.childList = childList;
        this.filteredData = this.data;
    },

    plot: function() {

        var offsetTop = this.container.node.offsetTop;
        var offsetLeft = this.container.node.offsetLeft;

        var margin = {top: 20, right: 20, bottom: 30, left: 120};
        var marginContext = {top: 10, right: 20, bottom: 10, left: 120};
        var width = this.container.node.offsetWidth - margin.left - margin.right;
        var height = this.container.node.offsetHeight - margin.top - margin.bottom;
        var contextHeight = 40;

        var x = d3.scale.linear()
            .range([0, width]);
        var x2 = d3.scale.linear()
            .range([0, width]);


        var yList = [];
        var colorList = [];
        var heightList = [];

        var xAxis = d3.svg.axis()
            .scale(x)
            .ticks(0)
            .orient("bottom");

        var yAxis = function(datum, index) {
            var axis = d3.svg.axis()
                .scale(yList[index])
                .orient("left");

            d3.select(this)
                .call(axis);
        };

        tip = d3.tip().attr('class', 'd3-tip')
            .render( enyo.bind(this, function(node, d) {
                this.tooltipView.setTo(d);
                this.tooltipView.renderInto(node);
            })
            );

        tip.offset(function(width) {
            return function(d) {
                return this.getBoundingClientRect().left > width / 2 ? [0, -10] : [0, 10];
            }
            }(width))
            .direction(function(width) {
                return function(d) {
                    return this.getBoundingClientRect().left > width / 2 ? "w" : "e";
                }
            }(width));

        brushed = function() {
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

            x.domain(brush.empty() ? x2.domain() : brush.extent());
            svg.selectAll(".line")
                .data(objects, function(d) {return d.obj})
                .attr("d", function(d) {
                      return line(d.values); });
            svg.selectAll(".dot")
                .data(function(d) {
                    return d.values; },
                    function(d) {
                        return d.index;})
                .attr("r", 5)
                .attr("cx", function(d) { return x(d.index); })
                .attr("cy", function(d) { return yList[d.class_index](d.method); })
                .style("fill", function(d) { return colorList[d.class_index](d.obj); })
            svg.select(".x.axis").call(xAxis);
        };

        var brush = d3.svg.brush()
            .x(x2)
            .on("brush", brushed);

        // data
        data = this.data;
        var index=0;
        data.forEach(function(d) {
            d.index = index++;
        });

        this.classData = d3.nest()
          .key(function(d) { return d.class; })
          .entries(data);

        this.classData.forEach( function(s, index) {
            s.class_index = index;
            // add class index to each entries
            s.values.forEach(function(e) {
                e.class_index = index;
            });

            // one color domain per class
            colorList[index] = d3.scale.category10();
            colorList[index].domain(s.values.filter(function(e, pos) {
                    return s.values.indexOf(e) == pos;
                })
                .map(function(e) {
                    return e.obj;
                })
            );

            // one height per class
            var methodList = d3.nest()
                .key(function(d) { return d.method; })
                .entries(s.values);

            heightList[index] = methodList.length * 20;

            // one y domain per class
            yList[index] = d3.scale.ordinal();
            yList[index].domain(s.values.map(function(o) { return o.method}))
                .rangePoints([heightList[index], 0]);

        });

        // context
        var context = d3.select("#" + this.$.context.id ).append("svg")
            .attr("width", width + marginContext.left + marginContext.right)
            .attr("height", contextHeight + marginContext.top + marginContext.bottom)
            .append("g")
                .attr("class", "context")
                .attr("transform", "translate(" + marginContext.left + "," + marginContext.top + ")");

        context.append("rect")
            .attr("class", "grid-background")
            .attr("width", width)
            .attr("height", contextHeight);

        var gBrush = context.append("g")
            .attr("class", "brush")
            .call(brush);

        gBrush.selectAll("rect")
            .attr("height", contextHeight);

        //plots containers
        var svg = d3.select("#" + this.$.focus.id).selectAll("svg")
            .data(this.classData, function(d) {return d.class_index;})
            .enter().append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", function(d, index) {
                    return heightList[index] + margin.top + margin.bottom;
                })
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.call(tip);
        svg.append("defs").append("clipPath")
            .attr("transform", "translate(" + 0 + "," + -7 + ")")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width + 7)
            .attr("height", height);


        x.domain(d3.extent(data, function(d) { return d.index; })).nice();
        x2.domain(x.domain());

        // axis
        svg.append("g")
            .attr("clip-path", "url(#clip)")
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
            .text(enyo.bind(this, function(d, index) { return this.classData[index].key;}));

        // lines
        var line = d3.svg.line()
            .interpolate("step-after")
            .x(function(d) { return x(d.index); })
            .y(function(d) { return yList[d.class_index](d.method); });

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

        this.line = svg.append("g")
            .attr("class", "object")
            .attr("clip-path", "url(#clip)");

        var object =
            this.line.selectAll(".object")
            .data(objects, function(d) {return d.obj})
            .enter();

        object.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.values); })
            .style("stroke", function(d) {
                    return colorList[d.class_index](d.obj);
                    });

        // scatter plot
        this.scatter = svg.append("g")
            .attr("class", "scatter")
            .attr("clip-path", "url(#clip)");

        var shapes =
            this.scatter.selectAll(".dot")
            .data(function(d) { return d.values; }, function(d) {return d.index;})
            .enter();

        // events
        shapes.append("circle")
            .filter(function(d){ return d.type == "event"; })
            .attr("class", "dot")
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.index); })
            .attr("cy", function(d) { return yList[d.class_index](d.method); })
            .style("fill", function(d) { return colorList[d.class_index](d.obj); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on("click", enyo.bind(this, "filter"));

        // entry
        shapes.append("rect")
            .filter(function(d){ return d.type == "entry"; })
            .attr("class", "dot")
            .attr("x", function(d) { return x(d.index) - 5; })
            .attr("y", function(d) { return yList[d.class_index](d.method) - 5; })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d) { return colorList[d.class_index](d.obj); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on("click", enyo.bind(this, "filter"));

        // exit
        shapes.append("rect")
            .filter(function(d){ return d.type == "exit"; })
            .attr("class", "dot")
            .attr("transform", function(d) { return "rotate(45 "
                + Math.round(x(d.index) - 5) + " "
                + Math.round(yList[d.class_index](d.method) - 5) + ")"})
            .attr("x", function(d) { return x(d.index) - 5; })
            .attr("y", function(d) { return yList[d.class_index](d.method) - 5; })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d) { return colorList[d.class_index](d.obj); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on("click", enyo.bind(this, "filter"));

        this.svg = svg;
        this.x = x;
        this.yList = yList;
        this.colorList = colorList;
    },

    updatePlot: function() {
        d3.selectAll('.dot')
           .data(this.filteredData, function(d) {return d.index;})
            .exit()
            .transition()
            .delay(0)
            .remove();

        d3.selectAll('.line')
           .data(this.filteredData, function(d) {
                return d.obj;})
            .exit()
            .transition()
            .delay(0)
            .remove();

    },

    clearFilter: function() {
        var svg = this.svg;
        var x = this.x;
        var yList = this.yList;
        var colorList = this.colorList;

        this.filteredData = this.data;

        this.scatter
            .data(this.classData, function(d) {return d.class_index;})

        var shapes = this.scatter.selectAll('.scatter .dot')
            .data(function(d) {return d.values;}, function(d) { return d.index})
            .enter();

        // events
        shapes.append("circle")
            .filter(function(d){ return d.type == "event"; })
            .attr("class", "dot")
            .attr("r", 5)
            .attr("cx", function(d) {
                return x(d.index); })
            .attr("cy", function(d) { return yList[d.class_index](d.method); })
            .style("fill", function(d) { return colorList[d.class_index](d.obj); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on("click", enyo.bind(this, "filter"));


        // entry
        shapes.append("rect")
            .filter(function(d){ return d.type == "entry"; })
            .attr("class", "dot")
            .attr("x", function(d) { return x(d.index) - 5; })
            .attr("y", function(d) { return yList[d.class_index](d.method) - 5; })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d) { return colorList[d.class_index](d.obj); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on("click", enyo.bind(this, "filter"));


        // exit
        shapes.append("rect")
            .filter(function(d){ return d.type == "exit"; })
            .attr("class", "dot")
            .attr("transform", function(d) { return "rotate(45 "
                + Math.round(x(d.index) - 5) + " "
                + Math.round(yList[d.class_index](d.method) - 5) + ")"})
            .attr("x", function(d) { return x(d.index) - 5; })
            .attr("y", function(d) { return yList[d.class_index](d.method) - 5; })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d) { return colorList[d.class_index](d.obj); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on("click", enyo.bind(this, "filter"));

        // lines
        var line = d3.svg.line()
            .interpolate("step-after")
            .x(function(d) { return x(d.index); })
            .y(function(d) { return yList[d.class_index](d.method); });

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

        this.line
            .data(this.classData, function(d) {return d.class_index;});
            //.data(objects, function(d) {return d.obj});

        var object =
            this.line.selectAll(".object .line")
            .data(objects, function(d) {return d.obj})
            .enter();

        object.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.values); })
            .style("stroke", function(d) {
                    return colorList[d.class_index](d.obj);
                    });

        // this.updatePlot();
    },

    filter: function(entry) {
        var filteredData = [];
        var me = this;
        this.data.forEach(function(e) {
            if(e.type != "link") {
                if(me.eventIsChildOf(e, entry)) {
                    filteredData.push(e);
                }
                else if(me.eventIsParentOf(e, entry)) {
                    filteredData.push(e);
                }
            }
        });

        this.filteredData = filteredData;
        this.updatePlot();
    },

    eventIsChildOf: function(event, obj) {
        if(event.obj == obj.obj)
            return true;

        for(index in this.childList) {
            // there is a parent for the current event
            if(this.childList[index].parent.obj == event.obj) {
                if(this.childList[index].child.obj == obj.obj)
                    return true;
                if(this.eventIsChildOf(this.childList[index].child, obj) == true)
                    return true;
            }
        }
        return false;
    },

    eventIsParentOf: function(event, obj) {
        if(event.obj == obj.obj)
            return true;

        for(index in this.childList) {
            // there is a child for the current event
            if(this.childList[index].child.obj == event.obj) {
                if(this.childList[index].parent.obj == obj.obj)
                    return true;
                if(this.eventIsParentOf(this.childList[index].parent, obj) == true)
                    return true;
            }
        }
        return false;
    }


});
