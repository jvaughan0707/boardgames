const User = require('../models/user');

function validate(user) {
    return new Promise((resolve, reject) => {
        User.findOne({ _id: user.userId}, function(err, result) {
            if (err) {
                reject(err); 
            }
            else if ((result != null &&  result.key == user.userKey)) {
                resolve(true);
            }        
            else {
                reject("Invalid credentials")
            }
        });
    });
}

function create (displayName) {
    var key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const user = new User({ displayName, key });

    return user.save()
     .then(result => {
        const { _id } = result;
        return { displayName, userId: _id, userKey: key };
     });
}

module.exports = { 
    create,
    validate
}