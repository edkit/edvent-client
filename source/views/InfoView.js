/**
	For simple applications, you might define all of your views in this file.
	For more complex applications, you might choose to separate these kind definitions
	into multiple files under this folder.
*/

enyo.kind({
	name: "edvent.InfoView",
	classes: "onyx",
	components:[
        {kind: "onyx.Groupbox", components: [
			{kind: "onyx.GroupboxHeader", content: "Object"},
			{name:"cls", content: "", style: "padding: 8px;"},
			{name:"method", content: "", style: "padding: 8px;"},
            {name:"object", content: "", style: "padding: 8px;"},
			{name:"type", content: "", style: "padding: 8px;"}
		]},
		{tag: "br"},
        {kind: "onyx.Groupbox", components: [
			{kind: "onyx.GroupboxHeader", content: "Links"},
			{content: "I'm a group item!", style: "padding: 8px;"},
			{content: "I'm a group item!", style: "padding: 8px;"}
		]},
		{tag: "br"},
        {kind: "onyx.Groupbox", components: [
			{kind: "onyx.GroupboxHeader", content: "Attributes"},
            {name:"keys", components: [
            ]},
		]},
	],

    setTo : function(entry) {
        console.log("setTo");
        this.$.cls.setContent(entry.class);
        this.$.method.setContent(entry.method);
        this.$.object.setContent(entry.obj);
		this.$.type.setContent(entry.type);

        for(key in entry.data) {
            //this.$.keys.createComponent({content:"Foo", style: "padding: 8px;"});
        }
    }
});
