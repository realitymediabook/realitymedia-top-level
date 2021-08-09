let socket = io();

socket.on("connect", () => {
    console.log("connected to server");
});

window.CONSTANTS = {}

function sendRequest(url, body) {
    return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body
        })
        .then(response => response.json())
        .then(data => {
            return data
        }).catch(e => {
            console.log(e)
            alert("Unable to login " + e.message);
        })
}

function messageHandler(event) {
    const {
        action,
        key,
        value
    } = event.data

    if (action === "save") {
        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch (e) {
            alert("Unable to save SSO data:" + e.message);
        }

    } else if (action === "get") {
        event.source.postMessage({
            action: 'returnData',
            key,
            message: JSON.parse(window.localStorage.getItem(key))
        }, '*');
    } else if (action === "clear") {
        window.localStorage.setItem(key, JSON.stringify({ token: null, email: null }))
    }
}

window.addEventListener("DOMContentLoaded", () => {
    try {
        window.addEventListener("message", messageHandler)
        const storedData = window.localStorage.getItem("__ael_hubs_sso")
        if (storedData) {
            var data = JSON.parse(storedData);
            let k = Object.keys(data)
            k.forEach(key => {
                window.CONSTANTS[key] = data[key]
            });
            console.log(data)
        }

    } catch (e) {
        console.log("Failed to load constants", e);
    }
})