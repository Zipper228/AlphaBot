import { TatumLtcSDK } from "@tatumio/ltc";
const myapiKey = "t-64e0a779466065001cc714d7-64e0a779466065001cc714d8";
const ltcSDK = TatumLtcSDK({
    apiKey: myapiKey,
});
var address = "LNds7w4TS8wZJbZ25Xz2YyNnYQXV7C99xY";
var REPLACE_ME_WITH_PRIVATE_KEY = "T6BWARmX9GQbKovvXJd8DYnDfrM2RoPmkPPGFgHX8gDfUBxbRv5n";
function moreOrLessThanNum(value, valueCompareWith, percent) {
    if (value <= valueCompareWith * (1 + percent) &&
        value >= valueCompareWith * (1 - percent)) {
        return true;
    }
    else {
        return false;
    }
}
export async function checkAccountBalance(addressToCheck) {
    if (addressToCheck !== undefined) {
        try {
            const balance = await ltcSDK.blockchain.getBlockchainAccountBalance(addressToCheck);
            return String(Number(balance.incoming) - Number(balance.outgoing));
        }
        catch (error) {
            return "no";
        }
    }
}
export async function checkTransactionByUSD(address, value, litecoin) {
    console.log(value);
    console.log(address);
    var valueNew;
    if (litecoin) {
        valueNew = value;
    }
    else {
        valueNew = value / 5533.95;
    }
    try {
        const txByAddress = await ltcSDK.blockchain.getTransactionsByAddress(address, 10);
        for (let i = 0; i < txByAddress.length; i++) {
            var txInfo = txByAddress[i];
            let txOutputs;
            if (txInfo !== undefined) {
                txOutputs = txByAddress[i].outputs;
                if (txOutputs !== undefined) {
                    for (let j = 0; j < txOutputs.length; j++) {
                        let txOutputsJth = txOutputs[j];
                        if (txOutputsJth.address === address &&
                            moreOrLessThanNum(Number(txOutputsJth.value), valueNew, 0.15)) {
                            console.log("This is", JSON.stringify(txOutputsJth), j);
                            return {
                                hash: JSON.stringify(txByAddress[i].hash),
                                index: j,
                                value: Number(txOutputsJth.value),
                            };
                        }
                        else {
                            console.log("not this one");
                        }
                    }
                }
                else {
                    console.log("Trouple with txOutputs");
                    return "false";
                }
            }
            else {
                console.log("Trouple with txinfo");
                return "false";
            }
        }
        return "false";
    }
    catch (error) {
        console.log("There was an error", error);
        return "false";
    }
}
//checkTransactionByUSD("LWAGUCtNf9pYPvAqpmspiLYyqCUCMh5s2U", 0.00155);
/*var address = "ltc1q6a5njket6mh6qwgmvnr0k0akq55jdmut7xshhe";
  var vout = 0;
  var hash = "4d2d22e87112b226807df231deb642b4b2fef15224f3f00c5fc7a79b01169eac";
  var index = vout;
  const resp = await fetch(
    `https://api.tatum.io/v3/litecoin/utxo/${hash}/${index}`,
    {
      method: "GET",
      headers: {
        "x-api-key": myapiKey,
      },
    }
  );

  var data = await resp.text();
  console.log(data);*/
var hash = "4d2d22e87112b226807df231deb642b4b2fef15224f3f00c5fc7a79b01169eac";
var recipientAddress = "ltc1q6a5njket6mh6qwgmvnr0k0akq55jdmut7xshhe";
export async function make_transaction(hash, index1, valueToSend1, recipientAddress1, privateKey1, changeAddress1) {
    const txHash = hash;
    const index = index1;
    const privateKey = privateKey1;
    var valueToSend = valueToSend1 * 0.15;
    valueToSend = Number(valueToSend.toFixed(8));
    var recipientAddress = recipientAddress1;
    const fee = "0.00001";
    const changeAddress = changeAddress1;
    console.log(hash +
        " " +
        index1 +
        " " +
        valueToSend1 +
        " " +
        recipientAddress1 +
        " " +
        privateKey1 +
        " " +
        changeAddress1);
    // Private key for utxo address
    // Set recipient values, amount and address where to send. Because of internal structure of LTC chain it is possible
    // to pass several input and output address-value pairs. We will work with one recipient
    // we expect to receive change from transaction to sender address back
    const options = { testnet: false };
    // Transaction - prepare tx to be sent and get compiled and signed transaction that can be broadcast
    try {
        /*const txData = await ltcSDK.transaction.prepareSignedTransaction(
          {
            fromUTXO: [
              {
                txHash: txHash,
                index: index,
                privateKey: privateKey,
              },
            ],
            to: [
              {
                address: recipientAddress,
                value: valueToSend,
              },
            ],
            fee: fee,
            changeAddress: changeAddress,
          } as LtcTransactionUTXO,
          options
        );
        console.log(`Transaction prepared: ${txData}`);
    
        // Transaction - send to blockchain
        // This method will prepare and broadcast transaction immediately
        // https://apidoc.tatum.io/tag/Litecoin#operation/LtcTransferBlockchain
        const { txId } = await ltcSDK.transaction.sendTransaction(
          {
            fromUTXO: [
              {
                txHash: txHash,
                index: index,
                privateKey: privateKey,
              },
            ],
            to: [
              {
                address: recipientAddress,
                value: valueToSend,
              },
            ],
            fee: fee,
            changeAddress: changeAddress,
          } as LtcTransactionUTXO,
          options
        );
        console.log(`Transaction sent: ${txId}`);*/
        const txData = await ltcSDK.transaction.sendTransaction({
            fromAddress: [
                {
                    address: changeAddress,
                    privateKey: privateKey,
                },
            ],
            to: [
                {
                    address: recipientAddress,
                    value: valueToSend,
                },
            ],
            fee: fee,
            changeAddress: changeAddress,
        }, options);
        console.log(`Transaction sent: ${JSON.stringify(txData)}`);
        return JSON.stringify(txData);
    }
    catch (error) {
        console.log(error);
        return "failed";
    }
}
