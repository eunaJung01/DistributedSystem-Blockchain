import express from "express";
import nunjucks from "nunjucks";
import {Wallet} from "./wallet";
import axios from "axios";
import * as process from "process";

const app = express();

const userId = process.env.USERID || "web7722";
const userPw = process.env.USERPW || "1234";
const baseURL = process.env.BASEURL || "http://localhost:3000";
const baseAuth = Buffer.from(userId + ":" + userPw).toString("base64");

const request = axios.create({
    baseURL,
    headers: {
        Authorization: "Basic " + baseAuth,
        "Content-type": "application/json",
    },
});

app.use(express.json());
app.set("view engine", "html");
nunjucks.configure("views", {
    express: app,
    watch: true,
});

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/newWallet", (req, res) => {
    res.json(new Wallet());
});

app.listen(3005, () => {
    console.log("server onload port # : 3005");
});

// list
app.post("/walletList", (req, res) => {
    const list = Wallet.getWalletList();
    res.json(list);
});

// view
app.get("/wallet/:account", (req, res) => {
    const {account} = req.params;
    console.log("wallet", account);
    const privateKey = Wallet.getWalletPrivateKey(account);
    res.json(new Wallet(privateKey));
});

// 아래 요청을 받은 지갑 서버는
// 1. 해당 요청을 보낸 사람의 계정 정보를 이용해 서명을 만든 후
// 2. 블록체인 HTTP Server 쪽으로 서명과 데이터를 전송해준다.
app.post("/sendTransaction", async (req, res) => {
    console.log(req.body);
    const {
        sender: {publicKey, account}, // 요청을 보낸 사람의 공개키, 계정
        received, // 보낼 계정
        amount, // 보낼 금액
    } = req.body;

    const signature = Wallet.createSign(req.body);

    const txObject = {
        sender: publicKey, // 공개키를 사용해 계정을 구할 수 있다.
        received,
        amount,
        signature,
    };

    // 블록체인 인터페이스 관리 HTTP 서버에 요청을 보낸다.
    const response = await request.post("/sendTransaction", txObject);
    console.log(response.data);
    res.json();
});
