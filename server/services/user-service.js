const User = require('../models/user');

function validate(user, onError, onSuccess) {
    User.findOne({ _id: user.userId}, function(err, result) {
        if (err) {
            onError(err); 
        }
        else if ((result != null &&  result.key == user.userKey)) {
            onSuccess(result)
        }        
        else {
            onSuccess(null)
        }
    });
}

function create (displayName) {
    var key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const user = new User({ displayName, key });

    return user.save();
}

module.exports = { 
    create,
    validate
}