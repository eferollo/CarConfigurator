const SERVER_URL = 'http://localhost:3001/api/';
const SERVER2_URL = 'http://localhost:3002/api/';

function getJson(httpResponsePromise) {
    return new Promise((resolve, reject) => {
        httpResponsePromise
            .then((response) => {
                if (response.ok) {
                    response.json()
                        .then(json => resolve(json))
                        .catch(err => reject({ error: `Cannot parse server response: ${err.message}` }))

                } else {
                    response.json()
                        .then(obj => reject(obj))
                        .catch(err => reject({ error: `Cannot parse server response: ${err}` }))
                }
            })
            .catch(err => reject({ error: `Cannot communicate: ${err.message}` }))
    });
}

/** Authentication functions **/

const logIn = async (credentials) => {
    return getJson(fetch(SERVER_URL + 'sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
    }));
}

const getUserInfo = async () => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
        credentials: 'include',
    }));
}

const logOut = async () => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
        method: 'DELETE',
        credentials: 'include',
    }));
}

async function getAuthToken() {
    return getJson(fetch(SERVER_URL + 'auth-token', {
        /* authentication cookie must be forwarded too */
        credentials: 'include'
    }));
}

/** Car Configurator APIs **/

const fetchCarModels = async() => {
    return getJson(fetch(SERVER_URL + 'carModels'));
}

const fetchCarAccessories = async() => {
    return getJson(fetch(SERVER_URL + 'accessories'));
}

const getUserCarConfiguration = async() => {
    return getJson(fetch(SERVER_URL + 'user/configuration', {
        credentials: 'include'
    }));
}

const saveUserCarConfiguration = async(userConfig) => {
    return getJson(fetch(SERVER_URL+ 'user/configuration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userConfig),
        credentials: 'include'
    }));
}

const updateUserCarConfiguration = async(userConfig) => {
    return getJson(fetch(SERVER_URL+ 'user/configuration/edit', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userConfig),
        credentials: 'include'
    }));
}

const deleteUserCarConfiguration = async() => {
    return getJson(fetch(SERVER_URL + 'user/configuration', {
        method: 'DELETE',
        credentials: 'include'
    }));
}

const getEstimationTime = async(authToken, accessories) => {
    return getJson(fetch(SERVER2_URL + `estimate`,{
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessories }),
    }));
}


const API = {
    logIn,
    logOut,
    getAuthToken,
    getUserInfo,
    fetchCarModels,
    fetchCarAccessories,
    getUserCarConfiguration,
    saveUserCarConfiguration,
    updateUserCarConfiguration,
    deleteUserCarConfiguration,
    getEstimationTime
};

export default API;
