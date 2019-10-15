var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	username: {
		type: String, 
		unique: true
	},
	password: String,
	avatar: String,
	avatarId: String,
	firstName: {
		type: String, 
		unique: true
	},
	lastName: String,
	email: {
		type: String, 
		unique: true
	},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin: {
		type: Boolean, 
		deafult: false
	}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);