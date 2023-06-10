import {SHA256} from "crypto-js";
import elliptic from "elliptic";
import {Failable} from "Failable";
import {UnspentTxOut} from "../transaction/unspentTxOut";
import {Transaction} from "../transaction/transaction";

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

    constructor(_sender: string, _signature: Signature, _unspentTxOuts: IUnspentTxOut[]) {
        this.publicKey = _sender;
        this.account = Wallet.getAccount(this.publicKey);
        this.balance = Wallet.getBalance(this.account, _unspentTxOuts);
        this.signature = _signature;
    }

    public static getAccount(_publicKey: string): string {
        return Buffer.from(_publicKey).slice(26).toString();
    }

    public static getBalance(_account: string, _unspentTxOuts: IUnspentTxOut[]): number {
        return _unspentTxOuts
            .filter((v) => {
                return v.account == _account;
            })
            .reduce((acc, utxo) => {
                return (acc += utxo.amount);
            }, 0);
    }

    public static sendTransaction(_receivedTx: ReceivedTx, _unspentTxOuts: IUnspentTxOut[]): Transaction {
        // TODO: 서명 검증
        const verify = Wallet.getVerify(_receivedTx);
        if (verify.isError) {
            throw new Error(verify.error);
        }

        // TODO: 보내는 사람의 지갑 정보 최신화
        const myWallet = new this(_receivedTx.sender, _receivedTx.signature, _unspentTxOuts);

        // TODO: Balance 확인
        if (myWallet.balance < _receivedTx.amount) {
            throw new Error("잔액이 부족합니다.");
        }

        // TODO: Transaction 생성
        const myUTXO: UnspentTxOut[] = UnspentTxOut.getMyUnspentTxOuts(myWallet.account, _unspentTxOuts);
        return Transaction.createTransaction(_receivedTx, myUTXO);
    }

    public static getVerify(_receivedTx: ReceivedTx): Failable<undefined, string> {
        const {sender, received, amount, signature} = _receivedTx;
        const data: [string, string, number] = [sender, received, amount];
        const hash: string = SHA256(data.join("")).toString();

        // TODO: 공개키를 이용하여 서명을 검증한다.
        const keyPair = ec.keyFromPublic(sender, "hex");
        const isVerify = keyPair.verify(hash, signature);

        if (!isVerify) {
            return {isError: true, error: "서명이 올바르지 않습니다."};
        }
        return {isError: false, value: undefined};
    }

}
