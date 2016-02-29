/**
	For simple applications, you might define all of your views in this file.
	For more complex applications, you might choose to separate these kind definitions
	into multiple files under this folder.
*/

enyo.kind({
	name: "edvent.InfoView",
	classes: "onyx edvent-infoview",

	published: {
	  entry: undefined
	},

	components:[
        {kind: "onyx.Groupbox", components: [
			{name:"method", kind: "onyx.GroupboxHeader", content: ""},
			{name:"cls", content: "", style: "padding: 3px;"},
			{name:"object", content: "", style: "padding: 3px;"},
			{name:"type", content: "", style: "padding: 3px;"}
		]},
        {kind: "onyx.Groupbox", components: [
			{kind: "onyx.GroupboxHeader", content: "Attributes"},
            {name:"keys", components: [
            ]},
		]},
	],

	entryChanged: function() {
			this.setTo(this.entry);
	},

    setTo : function(entry) {
        this.$.cls.setContent(entry.class);
        this.$.method.setContent(entry.method);
        this.$.object.setContent(entry.obj);
		this.$.type.setContent(entry.type);

		this.$.keys.destroyComponents();
        for(key in entry.data) {
            this.$.keys.createComponent({content: "" + key + ": " + entry.data[key],
				style: "padding: 3px;"});
        }
    }
});
