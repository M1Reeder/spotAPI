module.exports = function(){
	var bcrypt = require('bcrypt'),
		SALT_WORK_FACTOR = 10,
		mongoose = require('mongoose');

	// Connect to Mongo
	var uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/crumbs';
	mongoose.connect(uristring, function (err, res) {
		if (err) {
			console.log ('ERROR connecting to: ' + uristring + '. ' + err);
		} else {
			console.log ('Succeeded connected to: ' + uristring);
		}
	});
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		console.log("connected to db");
	});

	/* - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - *
		Set up User Schema
		- this should be taken out and put into a User class at some point
	 * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - */
	var spotSchema = mongoose.Schema({
		name: {type: String, required:true},
		longitude: {type: Number, required:true},
		latitude: {type: Number, required:true}
	});

	var userSchema = mongoose.Schema({
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true},
		spots: [spotSchema]
	});

	userSchema.pre('save', function(next) {
		var user = this;

		if(!user.isModified('password')) return next();

		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if(err) return next(err);

			bcrypt.hash(user.password, salt, function(err, hash) {
				if(err) return next(err);
				user.password = hash;
				next();
			});
		});
	});

	userSchema.methods.comparePassword = function(candidatePassword, cb) {
		bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
			if(err) return cb(err);
			cb(null, isMatch);
		});
	};

	User = mongoose.model('User', userSchema);

	return {
		// PUBLIC FUNCTIONS
		saveUser: function( req, res ){
			var userObj = req.body;
			var newUser = new User(userObj);
			newUser.save(function(err, newUser){
				if(err) {
					console.log(err);
					res.send('{err: "Username already taken"}');
					return err;
				}
				console.log("new user: " + newUser.username);
				res.send('{err: "", msg: "' + newUser.username +' has been added successfully."}');
			});
		},

		getSpots: function(req, res){
			User.findOne({ username: req.user.username }, function(err, user) {
				if(err) {
					console.log(err);
					res.send('{err: "' + err + '"}');
					return err;
				}
				var spotArray = user.spots;
				res.send(spotArray);
			});
		},

		addSpot: function(req, res){
			User.findOne({ username: req.user.username }, function(err, user) {
				user.spots.push(req.body);
				user.save(function (err){
					if(err){
						console.log(err);
						res.send('{err: ' + err + '}');
						return err;
					}
					console.log((user.username + ' has added a spot').green);
					res.send('{err: "", msg: "Spot has been added"}');
				});
			});
		},

		updateSpot: function(req, res){
			User.findOne({ username: req.user.username }, function(err, user) {
				var spot = user.spots.id(req.body._id);
				//If the spot doesn't exist then create a new one
				if(spot !== undefined) {
					console.log(('Spot id not found for user ' + user.username).red);
					res.send('{err: "No spot with this id", msg: "The id you sent does not match any stop id for this user."}');
					return;
				}
				spot.name = req.body.name;
				spot.longitude = req.body.longitude;
				spot.latitude = req.body.latitude;

				user.save(function (err){
					if(err){
						console.log(err);
						res.send('{err: ' + err + '}');
						return err;
					}
					res.send('{err: "", msg: "Spot has been updated"}');
				});
			});
		},

		deleteSpot: function(req, res){
			User.findOne({ username: req.user.username }, function(err, user) {
				var spot = user.spots.id(req.body.id).remove();
				user.save(function (err){
					if(err){
						console.log(err);
						res.send('{err: ' + err + '}');
						return err;
					}
					res.send('{err: "", msg: "Spot has been deleted"}');
				});
			});
		},
	};
}();
