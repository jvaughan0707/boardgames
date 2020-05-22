const User = require('../models/user');

class UserService {
    validate(user, onSuccess, onError) {
        var { displayName, userId, userKey } = user;
        var self = this;
        if (displayName) {
            if (userId && userKey) {
                User.findOne({ _id: userId}, function(err, result) {
                    if (err) {
                        onError(err); 
                    }
                    else if ((result != null &&  result.key == userKey)) {
                        onSuccess({ displayName, userId: result._id, userKey: result.key });
                    }        
                    else {
                        self.create(displayName, onSuccess);
                    }
                });
            }
            else {
                self.create(displayName, onSuccess);
            }
        }
        else {
            onError("Display name is required");
        }
    }

    create (displayName, onSuccess) {
        var key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const user = new User({ displayName, key });

        user.save()
        .then(result => 
            onSuccess({ displayName, userId: result._id, userKey: result.key })
        );
    }
}

module.exports = {
     UserService
}