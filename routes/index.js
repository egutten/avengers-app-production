var express    = require("express");
var router     = express.Router();
var passport   = require("passport");
var User       = require("../models/user");
var Movie      = require("../models/movie");
// var Quote      = require("../models/quote");
var async      = require("async");
var nodemailer = require("nodemailer");
var crypto     = require("crypto");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};    
var upload = multer({ storage: storage, fileFilter: imageFilter});
var cloudinary = require('cloudinary');
require('dotenv').config();
cloudinary.config({ 
  cloud_name: 'dy6kyyprj', 
  api_key: 387751374424766, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Root
router.get("/", function(req, res){
	res.redirect("/movies");
});

// Show register form
router.get("/register", function(req, res){
	res.render("register");
});

// Handles register logic
router.post("/register", upload.single('avatar'), function(req, res) {
	cloudinary.v2.uploader.upload(req.file.path, function(err, result){
		if(err) {
			console.log(err);
			req.flash("error", err.message);
			return res.redirect("back");
		}
		req.body.avatar = result.secure_url;
		req.body.avatarId = result.public_id;
		var newUser = new User({
			username: req.body.username, 
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			avatar: req.body.avatar,
			avatarId: req.body.avatarId,
			isAdmin: false
		});
		if(req.body.adminCode === 'capisthebest') {
			newUser.isAdmin = true;
		}
		User.register(newUser, req.body.password, function(err, user){
			if(err){
				console.log(err);
				req.flash("error", err.message);
				return res.render("register", {error: err.message});
			}
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Thanks for joining our awesome community " + user.username + "!");
				res.redirect("/movies");
			});
		});
	});	
});

// Show login form
router.get("/login", function(req, res){
	res.render("login");
});

// Handles login logic
router.post("/login", passport.authenticate("local", 
	{
	 successRedirect: "/movies", 
	 failureRedirect: "/login",
	 failureFlash: true
	}), function(req, res){
});

// Logout route
router.get("/logout", function(req, res){
	req.logout();
	res.redirect("/movies");
});

// User profile
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
			res.redirect("/");
		} else {
			if(!foundUser) {
					req.flash("error", "User not found.");
					return res.redirect("back");
				}
		}
		Movie.find().where('author.id').equals(foundUser._id).exec(function(err, movies){
			if(err){
				console.log(err);
				req.flash("error", "Something went wrong");
				res.redirect("/");
			}
			res.render("users/show", {user: foundUser, movies: movies});
		});
	});
});

// Edit user profile
router.get("/users/:id/edit", middleware.checkUser, function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
			res.redirect("/users/:id");
		} else {
			if(!foundUser) {
					req.flash("error", "User not found.");
					return res.redirect("back");
			}
			res.render("users/edit", {user: foundUser});
		}
	});
});

// Update user profile
router.put("/users/:id", middleware.checkUser, upload.single('avatar'), function(req, res){
	User.findById(req.params.id, async function(err, user){
		if(err){
			console.log(err);
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			if(req.file){
				try{
					await cloudinary.v2.uploader.destroy(user.avatarId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					user.avatarId = result.public_id;
					user.avatar = result.secure_url;
				} catch(err) {
					console.log(err);
					req.flash("error", err.message);
					return res.redirect("back");
				}
			}
			if(req.body.adminCode === 'capisthebest') {
			user.isAdmin = true;
			} else if (req.body.revokeAdmin){
				user.isAdmin = false;
			}
			user.firstName = req.body.firstName;
			user.lastName = req.body.lastName;
			user.email = req.body.email;
			user.save();
			req.flash("success", "Successfully updated profile!");
			res.redirect("/users/" + req.params.id);
		}
	});
});

// Destroy user
router.delete("/users/:id", middleware.checkUser, function(req, res){
	User.findById(req.params.id, async function(err, user){
		if(err) {
			console.log(err);
			req.flash("error", err.message);
			res.redirect("back");
		}
		try {
			await cloudinary.v2.uploader.destroy(user.avatarId);
			user.remove();
			req.flash("success", "Profile deleted");
			res.redirect("/movies");
		} catch(err) {
			console.log(err);
			req.flash("error", err.message);
			res.redirect("back");
		}
	});
});

// Forgot password
router.get("/forgot", function(req, res) {
  res.render("users/forgot");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'guttenberg.emily@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'avengers.app@gmail.com',
        subject: 'Avengers App Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('users/reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'guttenberg.emily@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'avengers.app@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your Avengers App account has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/movies');
  });
});


module.exports = router;