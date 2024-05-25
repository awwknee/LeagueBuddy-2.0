import {exec, spawn} from 'node:child_process';
import {promisify} from 'node:util';

const execPromise = promisify(exec);

function createRiotHeader(token: string, port: string, version: string) {
    return {
        'Host': '127.0.0.1:' + port,
        'Connection': 'keep-alive',
        'Authorization': 'Basic ' + Buffer.from(`riot:${token}`).toString("base64"),
        'Accept': 'application/json',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '127.0.0.1',
        'Content-Type': 'application/json',
        'Origin': 'https://127.0.0.1:' + port,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?F',
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) RiotClient/${version.split("\r\n")[0]} (CEF 74) Safari/537.36`,
        'sec-ch-ua': 'Chromium',
        'Referer': `https://127.0.0.1:${port}/index.html`,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
    }
}

export { execPromise as exec, spawn, createRiotHeader }