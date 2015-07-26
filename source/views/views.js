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
            {kind:"enyo.FileInputDecorator", onSelect:"customSelected", components:[
                {kind: "onyx.IconButton", src:"assets/open.png"}
            ]}
        ]},
		{kind: "enyo.Scroller", fit: true, components: [
			{kind: "edvent.EventPlot", name: "plot"}
		]}
	],
    customSelected: function(inSender, inEvent) {
        var file = inEvent.files[0];
        var reader = new FileReader();

        reader.onload = enyo.bind(this, "fileLoaded");
        reader.readAsText(file);

	},

    fileLoaded: function(e) {
        data = JSON.parse(e.target.result);
        this.$.plot.setData(data);
        this.$.plot.plot();
    }

});
