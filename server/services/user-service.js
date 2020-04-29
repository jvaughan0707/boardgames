const User = require('../models/user');

function validate(user) {
    var { displayName, userId, userKey } = user;
    return new Promise((resolve, reject) => {
        if (displayName) {
            if (userId && userKey) {
                User.findOne({ _id: userId}, function(err, result) {
                    if (err) {
                        reject(err); 
                    }
                    else if ((result != null &&  result.key == userKey)) {
                        resolve(user);
                    }        
                    else {
                        resolve(create(displayName).then(result => { 
                            user.userId = result.userId; 
                            user.userKey = result.userKey
                        }));
                    }
                });
            }
            else {
                resolve(create(displayName).then(result => { 
                    user.userId = result.userId; 
                    user.userKey = result.userKey
                }));
            }
        }
        else {
            reject("Display name is required");
        }
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