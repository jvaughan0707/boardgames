import Cookies from 'universal-cookie';
import { usersAPI } from '../api';

const cookies = new Cookies();

function getUser() {
    return new Promise((resolve, reject) => {
        var userId = cookies.get("userId");
        var displayName = cookies.get('displayName');

        if (userId == null) {
            resolve(null);
        }
        else {
            usersAPI.validate().then((user) => {
                if (user == null && displayName != null) {
                    createUser(displayName).then((newUser) => {
                        resolve(newUser);
                    });
                }
                else {
                    const { _id, key } = user;
                    resolve ({ displayName, userId: _id, userKey: key});
                }
            })
            .catch(err => { 
                reject(err); 
            })
        }
      })
}

function createUser (displayName) {
    return  new Promise((resolve, reject) => {
        usersAPI.create({displayName}).then(json => {
            const { _id, key } = json;
            if (_id && key) {
                cookies.set('displayName', displayName)
                cookies.set('userId', _id)
                cookies.set('userKey', key)
                resolve({displayName, userId: _id, userKey: key})
            }
            else {
                resolve(null);
            }
      }).catch(err => reject(err));
    });
}

export {
    getUser,
    createUser
}