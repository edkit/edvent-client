/**
	Define and instantiate your enyo.Application kind in this file.  Note,
	application rendering should be deferred until DOM is ready by wrapping
	it in a call to enyo.ready().
*/

function parse_args(val) {
    var result = null,
        tmp = [];
    location.search
    //.replace ( "?", "" )
    // this is better, there might be a question mark inside
    .substr(1)
        .split("&")
        .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    });
    return result;
}

enyo.kind({
	name: "myapp.Application",
	kind: "enyo.Application",
	view: "myapp.MainView",

	loadUrl: function(url) {
		this.view.loadUrl(url);
	},

	/*
	viewReadyChanged: function() {
		console.log("Changed");
	}
	*/
});

enyo.ready(function () {
	var app = new myapp.Application({name: "app"});
	loadUrl = parse_args("load");
	if(loadUrl != null) {
		app.loadUrl(loadUrl);
	}
});
