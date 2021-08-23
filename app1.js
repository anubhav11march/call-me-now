const axios = require('axios');
const cache = {};

module.exports = async (ip) => {
    if (cache[ip]) {
        console.log(':: cache');
        return cache[ip];
    }

    console.log(':: API');
    const { data } = await axios.get(`https://xenodochial-noyce-fef3d2.netlify.app/.netlify/functions/ipinfo_ee557360-4524-48d9-bbb3-1237d972d0ca?ip=${ip}`);
    cache[ip] = data;

    return cache[ip];
};
