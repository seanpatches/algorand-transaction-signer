import { myAlgoWalletConnect, peraWalletConnect } from "../connect";
import { SignedTransaction, TransactionStatusTypes } from "../../types";

export async function signTransactionPera(
    txn: any,
    message: any,
    wallet: string,
): Promise<SignedTransaction> {
  const arrayTxn = [{
    txn,
    signers: [wallet],
  }]
  
  try {
    const result = await peraWalletConnect.signTransaction([arrayTxn], wallet);
    return await normalizeSignedTransaction(result[0]);
  } catch(err: unknown) {
    console.error(err)
    return { status: TransactionStatusTypes.fail}
  }
}
  
export async function signTransactionMyConnect(
  txn: any,
  wallet_address: string
): Promise<SignedTransaction> {
  try {
    const signedTxn = await myAlgoWalletConnect().signTransaction(txn.toByte());
    const sendResponse = await normalizeSignedTransaction(
      Buffer.from(signedTxn.blob).toString("base64")
    );
    return sendResponse;
  } catch (err: unknown) {
    console.error(err)
    return { status: TransactionStatusTypes.fail}
  }
}

async function normalizeSignedTransaction(signed_txn: string | Uint8Array): Promise<SignedTransaction> {
  const checkedSignedTransaction =
    typeof signed_txn === "string"
      ? signed_txn
      : Buffer.from(signed_txn).toString("base64");
  if (checkedSignedTransaction) {
    return { status: TransactionStatusTypes.success, signed_txn: checkedSignedTransaction };
  } else {
    return { status: TransactionStatusTypes.fail};
  }
}
  