import axios from 'axios';
import logger from './logger';

interface TriggerValue {
    timestamp: number;
}

interface ThreatDefValue {
    id: string;
    time: number;
}

class Unifi {
    isLogin: boolean;
    url: string;
    cookieToken: string[] | undefined;
    CSRFToken: string | undefined;

    constructor() {
        this.isLogin = false;
        this.url = "";
    }

    async login(url: string, user: string, password: string) {
        this.url = url;
        const resLogin = await axios.post(`${url}/api/auth/login`, {username: user, password: password});
        this.cookieToken = resLogin.headers['set-cookie'];
        this.CSRFToken = resLogin.headers['x-csrf-token'];
        this.isLogin = true;
    }

    async getAlertTriggers(from: number): Promise<Array<TriggerValue>> {
        if(!this.isLogin) return Promise.reject("please login");

        const timeNow = new Date().getTime() * 1e6;

        const triggers: Array<TriggerValue> = [];
        let triggerPage = 0;
        let triggerTotalPage = 1;
        while(triggerPage < triggerTotalPage) {
            const resTrigger = await axios.post(`${process.env.UNIFI_URL}/proxy/network/v2/api/site/default/system-log/triggers`, 
            { "timestampFrom": from, "timestampTo":timeNow, "triggerTypes":["TRAFFIC_RULE","TRAFFIC_ROUTE","FIREWALL_RULE"], "pageSize":100,"pageNumber": triggerPage},
            {headers: {Cookie: this.cookieToken, "x-csrf-token": this.CSRFToken}});

            triggerTotalPage = resTrigger.data.total_page_count;
            triggers.push.apply(triggers, resTrigger.data.data);
            triggerPage++;
        }
        
        return triggers;
    }

    async getAlertThreats(from:number): Promise<Array<TriggerValue>> {
        if(!this.isLogin) return Promise.reject("please login");

        const timeNow = new Date().getTime() * 1e6;

        const threats: Array<TriggerValue> = [];
        let Page = 0;
        let TotalPage = 1;
        while(Page < TotalPage) {
            const res: {data: {data: Array<ThreatDefValue>, total_page_count: number}} = await axios.post(`${process.env.UNIFI_URL}/proxy/network/v2/api/site/default/system-log/threats`, 
            {"timestampFrom":from,"timestampTo":1705615199999,"threatDirections":["INTERNAL","OUTGOING","INCOMING"],"threatTypes":["HONEYPOT","THREAT"],"pageSize":100,"pageNumber":Page},
            {headers: {Cookie: this.cookieToken, "x-csrf-token": this.CSRFToken}});

            TotalPage = res.data.total_page_count;
            for(const threatDef of res.data.data) {
                const resThreat = await axios.get(`${process.env.UNIFI_URL}/proxy/network/v2/api/site/default/system-log/alarm/${threatDef.id}`,{headers: {Cookie: this.cookieToken, "x-csrf-token": this.CSRFToken}});
                if(resThreat.status === 200) {
                    threats.push(resThreat.data);
                }
            }
             
            Page++;
        }
        
        return threats;
        
    }
}

const unifi = new Unifi();

export default unifi;