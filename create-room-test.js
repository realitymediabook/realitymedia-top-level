const fs = require('fs');
const fetch = require('node-fetch');
const jwtDecode = require( "jwt-decode");

require('dotenv').config()

let BEARER = "bearer " + process.env.BEARER

let body = {
    "hub": {
        name: "My Test Room",
        scene_id: "rPuqgP4",
        description: "UPDATED: This is a test room for my room creation test.",
        room_size: 30,
        //created_by_account: 1028041603173843802,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/build/main.v1.js"
        },
    }
}

let credentialsAccountId = function(token) {
    try {
        return jwtDecode(token).sub
    } catch (e) {
        return -1
    }
}

// fetch('https://xr.realitymedia.digital/api/v1/hubs', {
//         method: 'post',
//         body:    JSON.stringify(body),
//         headers: { 'Content-Type': 'application/json', "Authorization" : BEARER },
//     })
//     .then(res => res.json())
//     .then(json => {
//         console.log("returned " + json.length + " results")
//         console.log(json)
//     });


 let id = credentialsAccountId(process.env.BEARER)

 console.log(process.env.BEARER + " = ID " + id);

 fetch('https://xr.realitymedia.digital/api/v1/accounts/search', {
        method: 'post',
        body: JSON.stringify({ email: "blair@macmynatt.com" }),
        headers: { 'Content-Type': 'application/json', "Authorization" : BEARER },
    })
    .then(res => res.json())
    .then(json => {
        if (json.data) {
            console.log("returned " + json.data.length + " results")
            console.log(json.data)    
        } else if (json.errors) {
            console.log("returned " + json.errors.length + " errors")
            console.log(json.errors)    
        } else {
            console.log("returned unexpected results")
            console.log(json)    
        }
    });

    // error:  { errors: [ { detail: 'No accounts found.', code: 'NOT_FOUND' } ] }
    // sample: { data: [ { identity: [Object], id: '1028041603173843802' } ] }