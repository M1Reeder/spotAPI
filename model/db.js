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
				res.render('index', {title: newUser.username});
				//somehow sign this guy in
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
				console.log(spotArray);
				res.send(spotArray);
			});
		},

		addSpot: function(req, res){
			User.findOne({ username: req.user.username }, function(err, user) {
				user.spots.push(req.body);
				console.log(user);
				user.save(function (err){
					if(err){
						console.log(err);
						res.send('{err: ' + err + '}');
						return err;
					}
					res.send('{err: "null", msg: "Spot has been added"}');
				});
			});
		},

		updateSpot: function(req, res){

		},

		deleteSpot: function(req, res){

		},
	};
};