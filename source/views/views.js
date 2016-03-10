/**
	For simple applications, you might define all of your views in this file.
	For more complex applications, you might choose to separate these kind definitions
	into multiple files under this folder.
*/

enyo.kind({
	name: "myapp.MainView",
	kind: "FittableRows",
	fit: true,
	components:[
		{kind: "onyx.Toolbar", components: [
            {name: "errorPopup", kind: "onyx.Popup", centered: true, floating: true, classes:"onyx-sample-popup", style: "padding: 10px;"},
            {kind:"enyo.FileInputDecorator", onSelect:"customSelected", components:[
                {kind: "onyx.IconButton", src:"assets/open.png"}
            ]},
			{kind:"onyx.Button", content: "Clear Filter", ontap:"clearFilterTapped"}
        ]},
		{
			kind: 'FittableColumns', fit: true, components: [
				{kind: "enyo.Scroller", fit: true, components: [
					{kind: "edvent.EventPlot", name: "plot"}
				]}
		]}
	],
	create: function() {
        this.inherited(arguments);
    },

	loadUrl: function(url) {
		console.log(loadUrl);
		d3.json(url, enyo.bind(this, function(error, json) {
		  if (error) return this.dataError(error);;
		  this.dataLoaded(json);
	  }));
	},

    customSelected: function(inSender, inEvent) {
        var file = inEvent.files[0];
        var reader = new FileReader();

        reader.onload = enyo.bind(this, "fileLoaded");
        reader.readAsText(file);
	},

    fileLoaded: function(e) {
        var data;
        try {
            data = JSON.parse(e.target.result);
        }
        catch(e) {
			this.dataError(e);
            return;
        }

		this.dataLoaded(data);
    },


	dataError: function(e) {
		this.$.errorPopup.setContent(e);
		this.$.errorPopup.show();
	},

	dataLoaded: function(data) {
        this.$.plot.setData(data);
        this.$.plot.plot();
    },


	clearFilterTapped: function(inSender, inEvent) {
		this.$.plot.clearFilter();
	}

});
