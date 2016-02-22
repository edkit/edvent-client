## About

edVent is a visualization tool that helps debugging event based software, and
more specifically state machines. It is based on enyojs and d3js. Load a dump of
yours events formatted as a json array and you can easily see what happened.


## Json input format

The input logs are structured in json objects. The log structure is the
following one:

    {
      "t": "iso8601 date",
      "class":"string",
      "method":"string",
      "obj":"string",
      "type":"string",
      "data_in":{object}
      "data_out":{object}
    }

- t : The timestamp of the event
- class : The class name
- method : The method name
- obj : the object identifier
- type : event|entry|exit|link
- data_in : Contains the list of input parameters
- data_out : Contains the list of output parameters (result).

Example:

    [
        { "t" : "0", "class" : "hsm1", "obj" : "1", "method" : "state3", "data_in" : {} },
        { "t" : "0", "class" : "hsm1", "obj" : "1", "method" : "state2", "data_in" : {} },
        { "t" : "0", "class" : "hsm1", "obj" : "2", "method" : "state3", "data_in" : {} },
    ]
