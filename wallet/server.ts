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
