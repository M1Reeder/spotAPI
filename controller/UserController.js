
/*
 * GET home page.
 */

module.exports = function(db){

	return {

		login: function(req, res){
			console.log('user got authenticated woot');
		},

		logout: function(req, res){
			req.logout();
			res.redirect('/');
		},

		signup: function(req, res){
			db.saveUser(req, res);
		}

	};
};