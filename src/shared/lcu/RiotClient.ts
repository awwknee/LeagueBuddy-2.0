import BaseClient from "./BaseClient";
import Manager from "./Manager";
import { createRiotHeader } from "./utils";
import fetch from 'node-fetch';
import https from 'node:https';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});


class RiotClient extends BaseClient {
    private username: string;
    private password: string;



    public constructor(manager: Manager, processId: string, token: string, port: string, version: string, username: string, password: string) {
        super(manager, processId, token, port, version);

        this.username = username;
        this.password = password;

    }

    async login() {
        try {
            const header = createRiotHeader(this.token, this.port.toString(), this.version);
            await fetch(`https://127.0.0.1:${this.port}/rso-auth/v2/authorizations`, { agent: httpsAgent, method: 'POST', headers: header, body: JSON.stringify(this.refreshSessionBody)});
            await fetch(`https://127.0.0.1:${this.port}/rso-auth/v1/session/credentials`, { agent: httpsAgent, method: "PUT", headers: header, body: JSON.stringify(this.loginBody)});
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }

    }

    get refreshSessionBody() {
        return {
            "clientId": "riot-client",
            "trustLevels": ["always_trusted"]
        }
    }

    get loginBody() {
        return {
            "username": this.username,
            "password": this.password,
            "persistLogin": false,
        }
    }
}

export default RiotClient;