
/*
 * API Controller
 */

module.exports = function(db){

	return {

		get: function(req, res){
			db.getSpots(req, res);
		},

		post: function(req, res){
			db.addSpot(req, res);
		},

		put: function(req, res){
			db.updateSpot(req, res);
		},

		del: function(req, res){
			db.deleteSpot(req, res);
		}

	};
};
