const queryParse = query => {
    const result = {};
    if (query) {
        decodeURIComponent(query)
            .split('&')
            .map(v => v.split('='))
            .forEach(v => {
                result[v[0]] = v[1];
            });
    }
    return result;
};

const getQueryStringify = (query = {}) => {
    const keys = Object.keys(query);
    if (!query || !keys.length) return '';

    return keys.map(key => `${key}=${query[key]}`).join('&');
};

module.exports = { queryParse, getQueryStringify }
