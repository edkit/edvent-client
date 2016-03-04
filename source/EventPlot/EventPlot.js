
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

    svgNodes: undefined, // list of svg containers
    lineGroupNodes: undefined, // list of line containers
    scatterGroupNodes: undefined, // list of scatter plot containers
    x: undefined,
    x2: undefined,
    yList: [],
    colorList: [],

    // d3 functions
    xAxis: undefined,
    brush: undefined,
    generateLine: undefined,

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
    },

    plot: function() {

        var offsetTop = this.container.node.offsetTop;
        var offsetLeft = this.container.node.offsetLeft;

        var margin = {top: 20, right: 20, bottom: 30, left: 120};
        var marginContext = {top: 10, right: 20, bottom: 10, left: 120};
        var width = this.container.node.offsetWidth - margin.left - margin.right;
        var height = this.container.node.offsetHeight - margin.top - margin.bottom;
        var contextHeight = 20;

        var x = d3.scale.linear()
            .range([0, width]);
        var x2 = d3.scale.linear()
            .range([0, width]);


        var yList = [];
        var colorList = [];
        var heightList = [];

        this.x = x;
        this.x2 = x2;

        this.xAxis = d3.svg.axis()
            .scale(this.x)
            .ticks(0)
            .orient("bottom");

        var yAxis = function(datum, index) {
            var axis = d3.svg.axis()
                .scale(yList[index])
                .orient("left");

            d3.select(this)
                .call(axis);
        };

        // tooltip
        tip = d3.tip().attr('class', 'd3-tip')
            .render( enyo.bind(this, function(node, d) {
                this.tooltipView.setTo(d);
                this.tooltipView.renderInto(node);
            }));

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
        this.brush = d3.svg.brush()
            .x(x2)
            .on("brush", enyo.bind(this, "onBrushed"));

        var contextSvgNode = d3.select("#" + this.$.context.id ).append("svg")
            .attr("width", width + marginContext.left + marginContext.right)
            .attr("height", contextHeight + marginContext.top + marginContext.bottom)
            .append("g")
                .attr("class", "context")
                .attr("transform", "translate(" + marginContext.left + "," + marginContext.top + ")");

        contextSvgNode.append("rect")
            .attr("class", "graph-context")
            .attr("width", width)
            .attr("height", contextHeight);

        var brushNode = contextSvgNode.append("g")
            .attr("class", "brush")
            .call(this.brush);

        brushNode.selectAll("rect")
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
            .call(this.xAxis);

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
        this.generateLine = d3.svg.line()
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

        this.lineGroupNodes = svg.append("g")
            .attr("class", "object")
            .attr("clip-path", "url(#clip)");

        var object =
            this.lineGroupNodes.selectAll(".object")
            .data(objects, function(d) {return d.obj})
            .enter();

        object.append("path")
            .attr("class", "line")
            .attr("d", enyo.bind(this, function(d) {
                return this.generateLine(d.values); }))
            .style("stroke", function(d) {
                    return colorList[d.class_index](d.obj);
                    });

        // scatter plot
        this.scatterGroupNodes = svg.append("g")
            .attr("class", "scatter")
            .attr("clip-path", "url(#clip)");

        var shapes =
            this.scatterGroupNodes.selectAll(".dot")
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
            .on("click", enyo.bind(this, "onLinkFilter"));

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
            .on("click", enyo.bind(this, "onLinkFilter"));

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
            .on("click", enyo.bind(this, "onLinkFilter"));

        this.svgNodes = svg;
        this.yList = yList;
        this.colorList = colorList;
    },

    clearFilter: function() {
        this.addNewEntries(this.data);
    },

    clearRemoveEntries: function(data) {
        d3.selectAll('.dot')
           .data(data, function(d) {return d.index;})
            .exit()
            .transition()
            .delay(0)
            .remove();

        d3.selectAll('.line')
           .data(data, function(d) {
                return d.obj;})
            .exit()
            .transition()
            .delay(0)
            .remove();

    },

    addNewEntries: function() {
        var svg = this.svgNodes;
        var x = this.x;
        var yList = this.yList;
        var colorList = this.colorList;

        this.scatterGroupNodes
            .data(this.classData, function(d) {return d.class_index;})

        var shapes = this.scatterGroupNodes.selectAll('.scatter .dot')
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
            .on("click", enyo.bind(this, "onLinkFilter"));


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
            .on("click", enyo.bind(this, "onLinkFilter"));


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
            .on("click", enyo.bind(this, "onLinkFilter"));

        // lines
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

        this.lineGroupNodes
            .data(this.classData, function(d) {return d.class_index;});
            //.data(objects, function(d) {return d.obj});

        var object =
            this.lineGroupNodes.selectAll(".object .line")
            .data(objects, function(d) {return d.obj})
            .enter();

        object.append("path")
            .attr("class", "line")
            .attr("d", enyo.bind(this, function(d) {
                return this.generateLine(d.values); }))
            .style("stroke", function(d) {
                    return colorList[d.class_index](d.obj);
                    });

        // this.updatePlot();
    },

    onBrushed: function() {
        var colorList = this.colorList;
        var x = this.x;
        var x2 = this.x2;
        var yList = this.yList;
        var svg = this.svgNodes;

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

        x.domain(this.brush.empty() ? this.x2.domain() : this.brush.extent());
        svg.selectAll(".line")
            .data(objects, function(d) {return d.obj})
            .attr("d", enyo.bind(this, function(d) {
                return this.generateLine(d.values); }));

        svg.selectAll(".dot")
            .data(function(d) {
                return d.values; },
                function(d) {
                    return d.index;})
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.index); })
            .attr("cy", function(d) { return yList[d.class_index](d.method); })
            .style("fill", function(d) { return colorList[d.class_index](d.obj); })
        svg.select(".x.axis").call(this.xAxis);
    },

    onLinkFilter: function(entry) {
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

        this.clearRemoveEntries(filteredData);
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
