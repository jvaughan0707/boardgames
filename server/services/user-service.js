const User = require('../models/user');

function validate(user) {
    return new Promise((resolve, reject) => {
        User.findOne({ _id: user.userId}, function(err, result) {
            if (err) {
                reject(err); 
            }
            else if ((result != null &&  result.key == user.userKey)) {
                resolve(result)
            }        
            else {
                resolve(null)
            }
        });
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