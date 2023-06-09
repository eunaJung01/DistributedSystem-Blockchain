import {randomBytes} from "crypto";
import elliptic from "elliptic";
import fs from "fs";
import path from "path";

const dir = path.join(__dirname, "../data");

const ec = new elliptic.ec("secp256k1");

export class Wallet {
    public account: string;
    public privateKey: string;
    public publicKey: string;
    public balance: number;

    // 1. privateKey를 인자값을 넣을 경우, 그 privateKey를 이용해 지갑 내용을 생성한다.
    // 2. 인자값이 없을 경우, 기존에 만들어 놓은 메서드를 사용해 지갑 내용을 생성한다.
    constructor(_privateKey: string = "") {
        this.privateKey = _privateKey || this.getPrivateKey();
        this.publicKey = this.getPublicKey();
        this.account = this.getAccount();
        this.balance = 0;

        Wallet.createWallet(this);
    }

    // 파일 시스템(fs)를 통해 파일을 만들고 개인키를 저장한다.
    static createWallet(myWallet: Wallet) {
        const fileName = path.join(dir, myWallet.account);
        const fileContent = myWallet.getPrivateKey();
        fs.writeFileSync(fileName, fileContent);
    }

    public getAccount(): string {
        return Buffer.from(this.publicKey).slice(26).toString();
    }

    public getPrivateKey(): string {
        return randomBytes(32).toString("hex");
    }

    public getPublicKey(): string {
        const keyPair = ec.keyFromPrivate(this.privateKey);
        return keyPair.getPublic().encode("hex", true);
    }

    static getWalletList(): string[] {
        // dir : 디렉토리명
        // 디렉토리 안에 있는 파일 목록을 가져온다.
        return fs.readdirSync(dir);
    }

    // 계정 정보를 받아서 개인키를 구한다.
    static getWalletPrivateKey(_account: string): string {
        const filePath = path.join(dir, _account);
        const fileContent = fs.readFileSync(filePath);
        return fileContent.toString();
    }

}
