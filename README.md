## About

edVent is a visualization tool that helps debugging state machines and event
based software. It is based on enyojs and d3js. Load a dump of yours events
formatted as a json array and you can easily see what happened.


## Json input format

Example:

    [
        { "t" : "0", "class" : "hsm1", "obj" : "1", "evt" : "state3", "data" : {} },
        { "t" : "0", "class" : "hsm1", "obj" : "1", "evt" : "state2", "data" : {} },
        { "t" : "0", "class" : "hsm1", "obj" : "2", "evt" : "state3", "data" : {} },
    ]

