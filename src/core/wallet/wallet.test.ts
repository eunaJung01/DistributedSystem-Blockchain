import {randomBytes} from "crypto";
import elliptic from "elliptic";
import {SHA256} from "crypto-js";

// elliptic 인스턴스 생성
const ellipticCurve = new elliptic.ec("secp256k1");

describe("지갑 이해하기", () => {
    let privateKey: string;
    let publicKey: string;
    let signature: elliptic.ec.Signature;

    it("개인키 생성하기", () => {
        privateKey = randomBytes(32).toString("hex");
        console.log("개인키 : ", privateKey);
        console.log("길이 : ", privateKey.length);
    });

    it("공개키 생성하기", () => {
        const keyPair = ellipticCurve.keyFromPrivate(privateKey);
        publicKey = keyPair.getPublic().encode("hex", true);
        console.log("공개키 : ", publicKey);
        console.log("길이 : ", publicKey.length);
    });

    it("서명 만들기", () => {
        const keyPair = ellipticCurve.keyFromPrivate(privateKey);
        const hash = SHA256("transaction data").toString();

        signature = keyPair.sign(hash, "hex");
        console.log("서명 : ", signature);
    });

    it("검증하기 (verify)", () => {
        const hash = SHA256("transaction data").toString();
        const verify = ellipticCurve.verify(hash, signature, ellipticCurve.keyFromPublic(publicKey, "hex"));
        console.log(verify);
    });

    it("계정 만들기(지갑 주소)", () => {
        const buffer = Buffer.from(publicKey);
        const address = buffer.slice(26).toString();
        console.log("계정 : ", address);
    });

});
