enyo.depends(
    // Layout library
    "$lib/layout",
    "$lib/d3.min.js",
    "$lib/d3-tip.js",
    // Onyx UI library
    "$lib/onyx",	// To theme Onyx using Theme.less, change this line to $lib/onyx/source,
    // CSS/LESS style files
    "style",
    // Model and data definitions
    "data",
    // View kind definitions
    "views",
    "fileinputdecorator",
    "EventPlot",
    // Include our default entry point
    "app.js"
);
