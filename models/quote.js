var mongoose = require("mongoose");

var quoteSchema = mongoose.Schema({
	text: String,
	character: String,
	createdAt: {type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	likes: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	]
});

module.exports = mongoose.model("Quote", quoteSchema);