import fs from 'fs';
const filePath = process.env.FILE_PATH || '.cache/state.lock';
export enum STATE_TYPE {
    trigger,
    threats,
}

export function readState(type: STATE_TYPE): number {
    const lockFile = fs.existsSync(filePath) ? fs.readFileSync(filePath) : "{}";
    const lockFileJson = JSON.parse(lockFile.toString());
    return lockFileJson[type] || 0;
}

export function writeState(type: STATE_TYPE, value: number) {
    const lockFile = fs.existsSync(filePath) ? fs.readFileSync(filePath) : "{}";
    const lockFileJson = JSON.parse(lockFile.toString());
    lockFileJson[type] = value;
    fs.writeFileSync(filePath, JSON.stringify(lockFileJson));
}