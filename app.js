var express          = require("express"),
	expressSanitizer = require("express-sanitizer"),
	bodyParser       = require("body-parser"),
	methodOverride   = require("method-override"),
	mongoose         = require("mongoose"),
	flash     	     = require("connect-flash"),
	passport         = require("passport"),
	LocalStrategy    = require("passport-local"),
	User             = require("./models/user"),
	Movie            = require("./models/movie"),
	Quote            = require("./models/quote"),
	app              = express();

// Requiring routes
var quoteRoutes      = require("./routes/quotes"),
	movieRoutes      = require("./routes/movies"),
	indexRoutes      = require("./routes/index");

mongoose.connect("mongodb://localhost:27017/avengers_app", {useNewUrlParser: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(flash());
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.locals.moment = require("moment");

// Use passport functionality
app.use(require("express-session")({
	secret: "Cap is totally cool",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

// Use routes
app.use("/", indexRoutes);
app.use("/movies/:slug/quotes", quoteRoutes);
app.use("/movies", movieRoutes);

app.listen(4000, process.env.IP, function(){
	console.log("server has started!");
});