const SHA256 = require("crypto-js/sha256");
const EC = require('elliptic').ec;
const ecdsa = new EC('secp256k1');
class Transaction{
    constructor(fromAddress, toAddress, ballot){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.ballot = ballot;
        this.timestamp = Date.now()
    }
    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
          return -1
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx);
        this.signature = sig.toDER('hex');
    }
    isValid() {
        if (this.fromAddress === null) return true;
    
        if (!this.signature || this.signature.length === 0) {
          throw new Error('No signature in this transaction');
        }
    
        const publicKey = ecdsa.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.ballot + this.timestamp).toString();
    }
}
class Block{
    constructor(timestamp, transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }
    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }
    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("BLOCK MINED: " + this.hash);
    }
    hasValidTransactions() {
        for (const tx of this.transactions) {
          if (!tx.isValid()) {
            return false;
          }
        }
        return true;
    }
}
class Blockchain{
    constructor() {
        this.chain = [this.createFirstBlock()];
        this.difficulty = 1;
        this.pendingTransactions = [];
        this.miningReward = 1;
    }
    setDiffculty(){
        if(chain%10 == 0 ){
            if(chain[this.chain.length -1].timestamp - chain[this.chain.length -10].timestamp <= 1000*60 ){ // trong 1p nếu trên 10 gd=>tăng độ khoa=s
                this.difficulty--;
            } else {
                this.difficulty ++;
            }
        }
    }
    createFirstBlock() {
        const privateKey = '324c9e7c840765e62042b6a2ad2935b7a2e0c256aa31dc26e8d49a3317bec822';
        const totalBChain = 9000000;
        return new Block(Date.parse('2020-05-20'),[new Transaction(null, ecdsa.keyFromPrivate(privateKey).getPublic('hex'), totalBChain )], "");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
    
    miningPendingTransactions(miningRewardAddress) {
        const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        this.chain.push(block);
        this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ];
    }
    createTransaction(transaction) {
        if (!transaction.toAddress) {
            return "Tổ chưc nhận phiếu bầu không hợp lệ";
        }
    
        // Verify the transactiion
        if (!transaction.isValid()) {
            return "Transaction không hợp lệ";
        }
        
        if (transaction.ballot === undefined || transaction === null) {
            return "Phiếu bầu không hợp lệ"
        }
        
        this.pendingTransactions.push(transaction);
        return 1;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
    getBalanceOfAddress(address){
        let balance = 0;
        for(const block of this.chain){
            for(const trans of block.transactions){
                if (trans.fromAddress === address){
                    balance -= parseInt(trans.amount);
                }
                if(trans.toAddress === address){
                    balance += parseInt(trans.amount);
                }
            }
        }
        return balance;
    }
    getTransactionOfAddress(address){
        let transactions = [];
        for(const block of this.chain){
            for(const trans of block.transactions){
                if (trans.fromAddress == address || trans.toAddress == address){
                   transactions.push(trans);
                }
            }
        }
        return transactions.length > 0 ? transactions : null;
    }
    getListPendingTransactions(){
        return  this.pendingTransactions;
    }
}
