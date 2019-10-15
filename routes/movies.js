var express = require("express");
var router = express.Router();
var Quote = require("../models/quote");
var Movie = require("../models/movie");
var middleware = require("../middleware");

// Index
router.get("/", function(req, res){
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Movie.find({title: regex}, function(err, allMovies){
			if(err){
				console.log(err);
				req.flash('error', 'Something went wrong');
			} else {
				if(allMovies.length < 1) {
					req.flash('error', 'No movies found.');
          			return res.redirect("back");
				} 
				res.render("movies/index", {movies: allMovies});
			}
		});
	} else {
	Movie.find({}, function(err, movies){
		if(err){
			console.log(err);
			req.flash('error', 'Something went wrong');
		} else {
			res.render("movies/index", {movies: movies});
				}
		});
	}
	
});

// New
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("movies/new");
});

// Create
router.post("/", middleware.isLoggedIn, function(req, res){
	req.body.movie.title = req.sanitize(req.body.movie.title);
	req.body.movie.synopsis = req.sanitize(req.body.movie.synopsis);
	req.body.movie.image = req.sanitize(req.body.movie.image);
	Movie.create(req.body.movie, function(err, newMovie){
		if(err){
			if(err.code == 11000){
				req.flash("error", "Someone has already posted that movie!");
			} else {
				req.flash("error", "Something went wrong...");
			}
			return res.redirect("back");
		} else {	  
			newMovie.author.id = req.user._id;
			newMovie.author.username = req.user.username;
			newMovie.save();
			req.flash("success", "Thanks for adding a movie!");
			res.redirect("/movies");
		}
	});
});

// Show
router.get("/:slug", function(req, res){
	Movie.findOne({slug: req.params.slug}).populate({path:"quotes", populate: {path: "likes"}}).exec(function(err, foundMovie){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
		} else {
			if(!foundMovie) {
					req.flash("error", "Movie not found.");
					return res.redirect("back");
			}
			res.render("movies/show", {movie: foundMovie});
		}
	});
});

// Edit
router.get("/:slug/edit", middleware.checkMovieOwnership, function(req, res){
	Movie.findOne({slug:req.params.slug}, function(err, foundMovie){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
			res.redirect("/movies");
		} else {
			if(!foundMovie) {
					req.flash("error", "Movie not found.");
					return res.redirect("back");
			}
			res.render("movies/edit", {movie: foundMovie});
		}
	});
});

// Update
router.put("/:slug", middleware.checkMovieOwnership, function(req, res){
	req.body.movie.title = req.sanitize(req.body.movie.title);
	req.body.movie.synopsis = req.sanitize(req.body.movie.synopsis);
	req.body.movie.image = req.sanitize(req.body.movie.image);
	Movie.findOne({slug:req.params.slug}, function(err, movie){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
			res.redirect("/movies");
		} else {
			movie.title = req.body.movie.title;
			movie.synopsis = req.body.movie.synopsis;
			movie.image = req.body.movie.image;
			movie.save(function (err){
				if(err){
					console.log(err);
					req.flash("error", "Something went wrong...");
					res.redirect("/movies");
				} else {
					req.flash("success", "Movie updated!");
					res.redirect("/movies/" + movie.slug);
				}
			});
			
		}
	});
});

// Destroy
router.delete("/:slug", middleware.checkMovieOwnership, function(req, res, next){
	Movie.findOne({slug: req.params.slug}, function(err, movie){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong...");
			res.redirect("/movies");
		}
		movie.remove();
		req.flash("success", "Movie deleted.");
		res.redirect("/movies");	
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
