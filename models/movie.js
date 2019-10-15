var mongoose = require("mongoose");
var Quote = require("./quote");

var movieSchema = new mongoose.Schema({
	title: {
		type: String,
	},
	image: String,
	quotes: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Quote"
		}
	],
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	slug: {
		type: String,
		unique: true
	},
	synopsis: String
});

movieSchema.pre("save", async function (next){
	try {
		if(this.isNew || this.isModified("title")) {
			this.slug = await generateUniqueSlug(this._id, this.title);
		}
		next();
	} catch (err) {
		next(err);
	}
});

movieSchema.pre("remove", async function(next){
	try {
		await Quote.deleteMany({
		"_id": {
			$in: this.quotes
			}
		});
	} catch(err) {
		req.flash("error", "Something went wrong...");
		res.redirect("/movies");
	}
});	

var Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;

async function generateUniqueSlug(id, movieName, slug) {
	try {
		// generate the initial slug
		if(!slug) {
			slug = slugify(movieName);
		}
		// check if a campground with the slug already exists
		var movie = await Movie.findOne({slug:slug});
		if(!movie || movie._id.equals(id)) {
			return slug;
		}
		// if not unique, generate a new slug
		var newSlug = slugify(movieName);
		// check again by calling the function recursively
		return await generateUniqueSlug(id, movieName, newSlug);
	} catch (err) {
		throw new Error(err);
	}
}

function slugify(text) {
	var slug = text.toString().toLowerCase()
		.replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
        .replace(/\-\-+/g, '-')      // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '')          // Trim - from end of text
        .substring(0, 75);           // Trim at 75 characters
	return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}