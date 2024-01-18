import 'dotenv/config';
import cron from 'node-cron';
import logger from './src/logger';
import axios, {AxiosError} from 'axios';
import { readState, writeState, STATE_TYPE } from './src/state_manager';
import unifi from './src/unifi';
import Http from './src/http';
import {flattenObject} from './src/util';


if(!process.env.UNIFI_URL) {
    logger.error('The Unifi url is missing use envar UNIFI_URL')
    process.exit();
}
if(!process.env.UNIFI_USERNAME) {
    logger.error('The Unifi username is missing use envar UNIFI_USERNAME')
    process.exit();
}
if(!process.env.UNIFI_PASSWORD) {
    logger.error('The Unifi password is missing use envar UNIFI_PASSWORD')
    process.exit();
}

if(!process.env.HTTP_URL) {
    logger.error('The http url is missing use envar HTTP_URL')
    process.exit();
}
const http = new Http(process.env.HTTP_URL || "")

let lock = false;

const alertsTriggerSync = async () => {
    const triggers = await unifi.getAlertTriggers(readState(STATE_TYPE.trigger));
    const triggersFlattan = triggers?.map((trigger) => ({...flattenObject(trigger), messageType: "alert_trigger", time: trigger.timestamp}));
    logger.info(`triggers: ${triggersFlattan.length}`);
    await http.push(triggersFlattan);
    if(triggersFlattan.length > 0) {
        writeState(STATE_TYPE.trigger, triggersFlattan[0].timestamp + 1)
    }
}

const alertsThreatsSync = async () => {
    const threats = await unifi.getAlertThreats(readState(STATE_TYPE.threats));
    const threatsFlattan = threats?.map((threat) => ({...flattenObject(threat), messageType: "alert_threat"}));
    logger.info(`threats: ${threatsFlattan.length}`);
    await http.push(threatsFlattan);
    if(threatsFlattan.length > 0) {
        writeState(STATE_TYPE.threats, threatsFlattan[0].time + 1)
    } 
}

const job =  async () => {
    if(lock) return;
    lock = true;
    try {
        await unifi.login(process.env.UNIFI_URL || "", process.env.UNIFI_USERNAME || "", process.env.UNIFI_PASSWORD || "")
        
        await Promise.all([alertsTriggerSync(), alertsThreatsSync()]);
        
    } catch(error: unknown) {
        if(axios.isAxiosError(error)) {
            const axsiosError = error as AxiosError;
            logger.error('Axios Error');
            logger.error(axsiosError.status);
            logger.error(axsiosError.response);
        } else {
            const generalError = error as Error;
            logger.error('Error');
            logger.error(generalError);
        }
    }
    
    lock = false;
}

cron.schedule(process.env.CRON_SCHEDULE || '*/5 * * * *', job);

job();