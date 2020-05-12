const Base = {
    postData: async (url = '', data = {}) => {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        });
        const results = await response.json();
        //check response status to find out if request was successful [200 - 400)
        return (response.status >= 200 && response.status < 400) ? {ok: true, data: results} : {ok: false, data: results};
    },
    
    getData: async (url = '', data = {}) => {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
        });
        const results = await response.json();
        //return (response.status >= 200 && response.status < 400) ? {ok: true, data: results} : {ok: false, data: results};
        return {status: response.status, data: results};
    },
};

export default Base;