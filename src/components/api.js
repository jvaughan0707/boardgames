const baseAPI = '/api';

function getAPI(modelName) {
    return {
        get() {
            return new Promise((resolve, reject) => {
                fetch(`${baseAPI}/${modelName}`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => reject(err));
            })
        },
        getById(id) {
            return new Promise((resolve, reject) => {
                fetch(`${baseAPI}/${modelName}/${id}`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => reject(err));
            })
        },
        create (game) {
            return new Promise((resolve, reject) => {
                fetch(`${baseAPI}/${modelName}`, {
                    method: 'POST',
                    body: JSON.stringify(game),
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => reject(err));
            })
        },
        update() {},
        delete() {}
    }
}

const gamesAPI = getAPI('games')

const usersAPI = {
    create (displayName) {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/users`, {
                method: 'POST',
                body: JSON.stringify(displayName),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.status === 500) {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        return response.json() 
                        .then((json) => {
                            const { message, stackTrace } = json;
                            reject(message + " " + stackTrace);
                          });
                    } else {
                        return response.text().then(text => {
                            reject(text);
                        });
                    }
                } else {
                    resolve(response.json());
                }
            })
            .catch(err => reject(err));
        })
    },

    validate () {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/users/validate`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.status === 500) {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        return response.json() 
                        .then((json) => {
                            const { message, stackTrace } = json;
                            reject(message + " " + stackTrace);
                          });
                    } else {
                        return response.text().then(text => {
                            reject(text);
                        });
                    }
                } else {
                    resolve(response.json());
                }
            })
            .catch(err => reject(err));
        })
    }
}

export { gamesAPI, usersAPI}