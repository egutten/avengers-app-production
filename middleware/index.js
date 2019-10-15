var Movie = require("../models/movie");
var Quote = require("../models/quote");
var User = require("../models/user");
var middlewareObj = {};

middlewareObj.checkMovieOwnership = function (req, res, next){
	if(req.isAuthenticated()){
		Movie.findOne({slug: req.params.slug}, function(err, foundMovie){
			if(err){
				req.flash("error", "Movie not found");
				res.redirect("back");
			} else {
				if(!foundMovie) {
					req.flash("error", "Movie not found.");
					return res.redirect("back");
				}
				if(foundMovie.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				} else {
					req.flash("error", "You don't have permission to do that!");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.checkQuoteOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Quote.findById(req.params.quote_id, function(err, foundQuote){
			if(err){
				res.redirect("back");
			} else {
				if(!foundQuote) {
					req.flash("error", "Quote not found.");
					return res.redirect("back");
				}
				if(foundQuote.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				} else {
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.checkUser = function(req, res, next){
	if(req.isAuthenticated()){
		User.findById(req.params.id, function(err, foundUser){
			if(err){
				res.redirect("back");
			} else {
				if(!foundUser) {
					req.flash("error", "User not found.");
					return res.redirect("back");
				}
				if(foundUser._id.equals(req.user._id)){
					next();
				} else {
					req.flash("error", "You don't have permission to do that!");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
};

module.exports = middlewareObj;