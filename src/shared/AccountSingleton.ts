import Account from "./Account";
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

class AccountsManager extends Map<string, Account> {
    public path: string;
    public dir: string;

    public constructor(path: string) {
        super();
        this.path = join(path, 'LeagueBuddy', 'accounts.json');
        this.dir = join(path, 'LeagueBuddy');
    }

    public save(accounts: Account[] | string) {
        writeFileSync(this.path, JSON.stringify(accounts));
    }

    public load(): Account[] {
        try {
            const data: Account[] = JSON.parse(readFileSync(this.path, 'utf8'));
            return data;
        } catch (error) {
            mkdirSync(this.dir);
            writeFileSync(this.path, JSON.stringify([]));
            return [];
        }
    }
}

export default AccountsManager