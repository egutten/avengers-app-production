var express = require("express");
var router = express.Router({mergeParams: true});
var Movie = require("../models/movie");
var Quote = require("../models/quote");
var middleware = require("../middleware");

// New quote form
router.get("/new", middleware.isLoggedIn, function(req, res){
	Movie.findOne({slug: req.params.slug}, function(err, movie){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
		} else {
			res.render("quotes/new", {movie: movie});
		}
	});
});

// Create quote
router.post("/", middleware.isLoggedIn, function(req, res){
	Movie.findOne({slug: req.params.slug}, function(err, movie){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
			res.redirect("/movies");
		} else {
			req.body.quote.text = req.sanitize(req.body.quote.text);
			req.body.quote.character = req.sanitize(req.body.quote.character);
			Quote.create(req.body.quote, function(err, quote){
				if(err){
					console.log(err);
					req.flash("error", "Something went wrong...");
				} else {
					quote.author.id = req.user._id;
					quote.author.username = req.user.username;
					quote.save();
					movie.quotes.push(quote);
					movie.save();
					req.flash("success", "Successfully added quote!");
					res.redirect("/movies/" + req.params.slug);
				}
			});
		}
	});
});

// Edit quote
router.get("/:quote_id/edit", middleware.checkQuoteOwnership, function(req, res){
	Quote.findById(req.params.quote_id, function(err, foundQuote){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
			res.redirect("back");
		} else {
			res.render("quotes/edit", {movie_slug: req.params.slug, quote: foundQuote});
		}
	});
});

// Like quote
router.post("/:quote_id/like", middleware.isLoggedIn, function (req, res){
	Quote.findById(req.params.quote_id, function (err, foundQuote) {
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
			return res.redirect("back");
		}
		var foundUserLike = foundQuote.likes.some(function (like){
			return like.equals(req.user._id);
		});
		
		if (foundUserLike) {
			req.flash("success", "You have unliked this quote");
			foundQuote.likes.pull(req.user._id);
		} else {
			req.flash("success", "Thanks for liking!");
			foundQuote.likes.push(req.user);
		}
		foundQuote.save( function(err) {
			if (err){
				console.log(err);
				req.flash("error", "Something went wrong...");
				return res.redirect("back");
			}
			return res.redirect("/movies/" + req.params.slug);
		});
	});
});

// Update quote
router.put("/:quote_id", middleware.checkQuoteOwnership, function(req, res){
	req.body.quote.text = req.sanitize(req.body.quote.text);
	req.body.quote.character = req.sanitize(req.body.quote.character);
	Quote.findByIdAndUpdate(req.params.quote_id, req.body.quote, function(err, updatedQuote){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
			res.redirect("back");
		} else {
			req.flash("success", "Successfully updated quote!");
			res.redirect("/movies/" + req.params.slug);
		}
	});
});

// Destroy quote
router.delete("/:quote_id", middleware.checkQuoteOwnership, function(req, res){
	Quote.findByIdAndRemove(req.params.quote_id, function(err){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
			res.redirect("back");
		} else {
			req.flash("success", "Quote deleted");
			res.redirect("/movies/" + req.params.slug);
		}
	});
});


module.exports = router;