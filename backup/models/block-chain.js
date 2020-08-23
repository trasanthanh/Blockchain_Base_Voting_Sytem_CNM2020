const EC = require('elliptic').ec;
const ecdsa = new EC('secp256k1');
var Block = require('./block');
var Transaction = require('./transaction');
class Blockchain{
    constructor() {
        this.chain = [this.createFirstBlock()];
        this.difficulty = 1;
        this.pendingTransactions = [];
        this.miningReward = 1;
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
        io.sockets.emit('block', JSON.stringify(block));
        io.sockets.emit('transaction', JSON.stringify(this.pendingTransactions));
        this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ];
    }
    createTransaction(transaction) {
        if (!transaction.toAddress) {
            return "Thiếu địa chỉ người nhận";
          }
      
          // Verify the transactiion
          if (!transaction.isValid()) {
           return "Transaction không hợp lệ";
          }
          
          if (transaction.amount <= 0 || isNaN(parseInt(transaction.amount)) ) {
           return "Số tiền không hợp lệ"
          }
          
          // Making sure that the amount sent is not greater than existing balance
          if (this.getBalanceOfAddress(transaction.fromAddress) < parseInt(transaction.amount)) {
            return "Tài khoản không đủ tiền"
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
module.exports = Blockchain;