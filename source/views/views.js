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
            ]}
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
            console.log(e);
            this.$.errorPopup.setContent(e);
            this.$.errorPopup.show();
            return;
        }

        this.$.plot.setData(data);
        this.$.plot.plot();
    }

});
