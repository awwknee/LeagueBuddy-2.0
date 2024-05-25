import Manager from "./Manager";
import { Credentials, createHttp1Request } from "league-connect";

class Client {
    private manager: Manager;
    private processId: number;
    private token: string;
    private port: number;

    private hidden: boolean;


    public constructor(manager: Manager, processId: string, token: string, port: string) {
        this.manager = manager;
        this.processId = parseInt(processId);
        this.token = token;
        this.port = parseInt(port);
        this.hidden = false;
    }

    public get credentials(): Credentials {
        return { port: this.port, password: this.token, pid: this.processId }
    }

    async hide(): Promise<boolean> {
        if (this.hidden) {
            return true;
        }

        try {
            const response = await createHttp1Request({ method: 'POST', url: '/riotclient/kill-ux' }, this.credentials);
            if (!response.ok) {
                this.hidden = false;
                return false;
            }
            this.hidden = true;
            return true;
        } catch (err) {
            this.hidden = false;
            console.error(err);
            return false;
        }
    }

    async show(): Promise<boolean> {
        if (!this.hidden) {
            return true;
        }

        try {
            const response = await createHttp1Request({ method: 'POST', url: '/riotclient/launch-ux' }, this.credentials);
            if (!response.ok) {
                this.hidden = true;
                return false;
            }
            this.hidden = false;
            return true;
        } catch (err) {
            this.hidden = true;
            console.error(err);
            return false;
        }
    }
}

export default Client;