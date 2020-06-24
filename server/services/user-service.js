const User = require('../models/user');

class UserService {
  validate(userId, userKey) {
    return new Promise((resolve, reject) => {
      var createUser = () => {
        var key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const user = new User({ key });

        user.save()
          .then(resolve);
      }

      if (userId && userKey) {
        User.findOne({ _id: userId }, function (err, result) {
          if (err) {
            reject(err);
          }
          else if ((result != null && result.key == userKey)) {
            resolve(result);
          }
          else {
            createUser();
          }
        });
      }
      else {
        createUser();
      }
    }).then(doc => ({ userId: doc._id.toString(), userKey: doc.key }))
     
  }
}

module.exports = UserService;