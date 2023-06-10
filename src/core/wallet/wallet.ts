import {SHA256} from "crypto-js";
import elliptic from "elliptic";
import e from "express";
import {Failable} from "Failable";

const ec = new elliptic.ec("secp256k1");
export type Signature = elliptic.ec.Signature;

export interface ReceivedTx {
    sender: string;
    received: string;
    amount: number;
    signature: Signature;
}

export class Wallet {
    public publicKey: string;
    public account: string;
    public balance: number;
    public signature: Signature;

    constructor(_sender: string, _signature: Signature) {
        this.publicKey = _sender;
        this.account = Wallet.getAccount(this.publicKey);
        this.balance = 0;
        this.signature = _signature;
    }

    static getAccount(_publicKey: string): string {
        return Buffer.from(_publicKey).slice(26).toString();
    }

    static sendTransaction(_receivedTx: ReceivedTx) {
        // TODO: 서명 검증
        const verify = Wallet.getVerify(_receivedTx);
        if (verify.isError) throw new Error(verify.error);

        // TODO: 보내는 사람의 지갑 정보 최신화
        const myWallet = new this(_receivedTx.sender, _receivedTx.signature);

        // TODO: Balance 확인

        // TODO: Transaction 만들기
    }

    static getVerify(_receivedTx: ReceivedTx): Failable<undefined, string> {
        const {sender, received, amount, signature} = _receivedTx;
        const data: [string, string, number] = [sender, received, amount];
        const hash: string = SHA256(data.join("")).toString();

        // TODO: 공개키를 이용하여 서명을 검증한다.
        const keyPair = ec.keyFromPublic(sender, "hex");
        const isVerify = keyPair.verify(hash, signature);
        if (!isVerify) return {isError: true, error: "서명이 올바르지 않습니다."};

        return {isError: false, value: undefined};
    }

}
