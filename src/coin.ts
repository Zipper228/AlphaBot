import { TatumLtcSDK } from "@tatumio/ltc";
import { Fiat } from "@tatumio/api-client";
import dotenv from "dotenv";

dotenv.config();

const ltcSDK = TatumLtcSDK({
  apiKey: process.env.API_KEY || "",
});

function moreOrLessThanNum(
  value: number,
  valueCompareWith: number,
  percent: number
) {
  if (
    value <= valueCompareWith * (1 + percent) &&
    value >= valueCompareWith * (1 - percent)
  ) {
    return true;
  } else {
    return false;
  }
}

export async function checkAccountBalance(addressToCheck: string | undefined) {
  if (addressToCheck !== undefined) {
    try {
      const balance = await ltcSDK.blockchain.getBlockchainAccountBalance(
        addressToCheck
      );
      return String(Number(balance.incoming) - Number(balance.outgoing));
    } catch (error) {
      throw "Такого аккаунта не существует.";
    }
  }
}

export async function checkTransactionByUSD(value: number, litecoin: boolean) {
  const address = process.env.MY_ADDRESS || "";
  console.log(address);
  var valueNew;
  if (litecoin) {
    valueNew = value;
  } else {
    const LTCrateRUB = await ltcSDK.getExchangeRate(Fiat.RUB);
    valueNew = value / Number(LTCrateRUB.value);
  }
  try {
    const txByAddress = await ltcSDK.blockchain.getTransactionsByAddress(
      address,
      10
    );

    for (let i = 0; i < txByAddress.length; i++) {
      var txInfo = txByAddress[i];
      let txOutputs;
      if (txInfo !== undefined) {
        txOutputs = txByAddress[i].outputs;
        if (txOutputs !== undefined) {
          for (let j = 0; j < txOutputs.length; j++) {
            let txOutputsJth = txOutputs[j];
            if (
              txOutputsJth.address === address &&
              moreOrLessThanNum(Number(txOutputsJth.value), valueNew, 0.15)
            ) {
              return {
                hash: JSON.stringify(txByAddress[i].hash),
                index: j,
                value: Number(Number(txOutputsJth.value).toFixed(8)),
              };
            }
          }
        } else {
          console.log("Trouple with txOutputs");
          throw "400";
        }
      } else {
        console.log("Trouple with txinfo");
        throw "400";
      }
    }
    return undefined;
  } catch (error) {
    console.log("There was an error", error);
    throw "400";
  }
}

export async function make_transaction(
  valueToSend1: number,
  recipientAddress1: string,
  share: number
) {
  const privateKey = process.env.MY_PRIVATE_KEY || "";
  var valueToSend = valueToSend1 * share;
  valueToSend = Number(valueToSend.toFixed(8));
  var recipientAddress = recipientAddress1;
  const fee = process.env.FEE;
  const changeAddress = process.env.MY_ADDRESS || "";

  const options = { testnet: false };

  try {
    const txData = await ltcSDK.transaction.sendTransaction(
      {
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
      },
      options
    );
    console.log(`Транзакция отправлена: ${JSON.stringify(txData)}`);
    return JSON.stringify(txData);
  } catch (error) {
    console.log(error);
    throw "Транзакция провалилась";
  }
}
