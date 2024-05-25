import Manager from "./Manager";
import { Credentials, createHttp1Request } from "league-connect";



class BaseClient {
    protected manager: Manager;
    protected processId: number;
    protected token: string;
    protected port: number;
    protected version: string;


    public constructor(manager: Manager, processId: string, token: string, port: string, version: string) {
        this.manager = manager;
        this.processId = parseInt(processId);
        this.token = token;
        this.port = parseInt(port);
        this.version = version;

    }

    public get credentials(): Credentials {
        return { port: this.port, password: this.token, pid: this.processId }
    }
}

export default BaseClient;