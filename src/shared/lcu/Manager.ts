import Client from "./Client";
import RiotClient from "./RiotClient";
import { exec, spawn } from './utils';

const command = (riotClient: boolean) => `Get-CimInstance -Query "SELECT * from Win32_Process WHERE name LIKE '${riotClient ? 'Riot Client.exe' : 'LeagueClientUx.exe'}'" | SELECT CommandLine, Path | format-list`;

interface ClientCredentials {
    path?: string,
    pid?: string,
    token?: string,
    port?: string,
}

class Manager {
    public clients: Map<string, Client> = new Map();


    public async initialize(): Promise<Client> {
        const { stdout, stderr } = await exec(command(false), { shell: 'powershell.exe' });

        if (stdout == '' || stderr != '') {
            return Promise.reject('No client currently open');
        }

        const tokens = Array.from(stdout.matchAll(/"--remoting-auth-token=(.+?)"/g));
        const ports = Array.from(stdout.matchAll(/"--app-port=(.+?)"/g));
        const pids = Array.from(stdout.matchAll(/"--app-pid=(.+?)"/g));

        for (let i = 0; i < tokens.length; i++) {
            return new Client(this, pids[i][1], tokens[i][1], ports[i][1]);
        }

        return Promise.reject('No client currently open');
    }

    public get() {
        // no-op
    }

    //"C:\Riot Games\Riot Client\RiotClientServices.exe" --launch-product=league_of_legends --launch-patchline=live
    public async create(username: string, password: string): Promise<RiotClient> {
        return new Promise((resolve, reject) => {
            const subprocess = spawn("C:\\Riot Games\\Riot Client\\RiotClientServices.exe", ["--launch-product=league_of_legends", "--launch-patchline=live"]/*['--allow-multiple-clients']*/, { detached: true });
            subprocess.on('spawn', () => {
                const interval = setInterval(async () => {
                    const { stdout } = await exec(command(true), { shell: 'powershell.exe'});
                    if (stdout) {
                        clearInterval(interval);
                        const { token, port, pid, path } = this.matchRiot(stdout);
                        if (token == undefined || port == undefined || pid == undefined || path == undefined) return;
                        const { stdout: version } = await exec(`(Get-Item -path '${path}').VersionInfo.FileVersion`, { shell: 'powershell.exe'});
                        resolve(new RiotClient(this, pid, token, port, version, username, password));
                    }
                }, 5000);
            });
            subprocess.on('error', (err) => reject(err));
        });
        // no-op
    }


    public remove() {
        // no-op
    }

    private match(output: string): ClientCredentials {
        const matchToken = output.match(/--remoting-auth-token=(.+?)/g)
        const matchPid = output.match(/--app-pid=(.+?) /g)
        const matchPort = output.match(/--app-port=(.+?) /g)

        if (matchToken != null && matchPid != null && matchPort != null) {
            return {
                path: output.split(":").slice(-2).join(':').trim(),
                pid: matchPid[0].split("=")[1].trimEnd(),
                token: matchToken[0].split("=")[1].trimEnd(),
                port: matchPort[0].split("=")[1].trimEnd()
            }
        }

        return {
            token: undefined,
            pid: undefined,
            port: undefined,
            path: undefined
        }
    }

    private matchRiot(output: string): ClientCredentials {
        const matchToken = output.match(/--remoting-auth-token=(.+?) /g)
        const matchPid = output.match(/--app-pid=(.+?) /g)
        const matchPort = output.match(/--app-port=(.+?) /g)

        if (matchToken != null && matchPid != null && matchPort != null) {
            return {
                path: output.split(":").slice(-2).join(':').trim(),
                pid: matchPid[0].split("=")[1].trimEnd(),
                token: matchToken[0].split("=")[1].trimEnd(),
                port: matchPort[0].split("=")[1].trimEnd()
            }
        }

        return {
            token: undefined,
            pid: undefined,
            port: undefined,
            path: undefined
        }
    }
}

export default Manager;