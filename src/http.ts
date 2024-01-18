const axios = require('axios');
const logger = require('./logger');

class HttpApi {
    url: string;
    constructor(url: string) {
        this.url = url;
    }

    async push(data: Array<Object>) {
        const res = await axios.post(`${this.url}/push`, data);
        logger.debug(res.status);
        if(res.status === 200) {
            logger.debug(`Write ${data.length} to the http successfully`);
        }
    }
}

export default HttpApi;