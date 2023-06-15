import './App.css';
import React, { FC, useEffect, useState } from 'react';
import { checkForPeraConnection, myAlgoWalletConnect, peraWalletConnect } from './util/connect';
import { ConnectionTypes, FormattedMyAlgoTransaction, FormattedPeraTransaction, SignedTransaction, TransactionStatusTypes } from './types';
import ConnectButtons from './components/ConnectButtons';
import LoadingScreen from './components/Loading';
import TransactionButtons from './components/TransactionButton';
import { formatTransaction } from './util/transactions/formatTransaction';
import { signTransactionMyConnect, signTransactionPera } from './util/transactions/transactions';

const App: FC = () => {
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [signedTransaction, setSignedTransaction] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<ConnectionTypes | null>();
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    //check localstorage for continued connection on page load
    peraWalletConnect.reconnectSession();
    peraSustainedCheck();
  })

  const disconnectWallet = (): void => {
    setUserWalletAddress(null);
    setConnectionType(null);
    setConnected(false);
    setSignedTransaction(null);
    connectionType === ConnectionTypes.pera && checkForPeraConnection() && peraWalletConnect.disconnect();
  }

  const setUserConnection = (userAlgoWallet: string, connectionType: ConnectionTypes): void => {
    setUserWalletAddress(userAlgoWallet);
    setConnectionType(connectionType);
    setConnected(true);
    setSignedTransaction(null);
  }

  const peraSustainedCheck = (): boolean => {
    const isConnectedToPera = checkForPeraConnection();
    const sustainedPeraWallet = peraWalletConnect?.connector?.accounts[0];
    if(isConnectedToPera && sustainedPeraWallet) {
      //reconnect, alter the state, and return true for to act as blocker
      setUserConnection(sustainedPeraWallet, ConnectionTypes.pera);
      return true;
    } else {
      return false;
    }
  }

  const launchTransaction = async() => {
    //load during request wait
    setSignedTransaction(null);
    setLoading(true);
    //check connectionType in state, launch either transaction type accordingly
    const isPera = connectionType === ConnectionTypes.pera;
    //amount and note hardcoded for the demo
    const amount = 1;
    const note = "Test Transaction on Algorand";
    const transaction = await formatTransaction(isPera, amount, userWalletAddress!, note);
    const signedTransaction = isPera
      ? await peraTransactionStart(transaction)
      : await myAlgoTransactionStart(transaction);
    setLoading(false);
    const { signed_txn, status } = signedTransaction;

    //if signed_txn was obtained, set it in state for visibility, and prepare to rawsend
    if(status === TransactionStatusTypes.success && signed_txn) {
      setSignedTransaction(signed_txn);
    } else {
      alert("An error has occurred in signing your transaction.")
    }
  }

  const peraTransactionStart = async (peraTransactionToSign: FormattedPeraTransaction ): Promise<SignedTransaction> => {
    return await signTransactionPera(peraTransactionToSign, 'Test Transaction', userWalletAddress!);
  }

  const myAlgoTransactionStart = async (myAlgoTransactionToSign: FormattedMyAlgoTransaction): Promise<SignedTransaction> => {
    return await signTransactionMyConnect(myAlgoTransactionToSign, userWalletAddress!);
  }

  const startConnectionPera = async (): Promise<void> => {
    //check for sustained connection
    const sustainedPeraWallet = await peraSustainedCheck();
    if(sustainedPeraWallet) return;
    
    try {
      const userAddresses = await peraWalletConnect.connect();
      const userAlgoWallet = userAddresses[0];
      //set wallet in state to retrieved wallet, if found, if not throw error
      userAlgoWallet
        ? setUserConnection(userAlgoWallet, ConnectionTypes.pera)
        : alert("No found wallet.")
    } catch(err) {
        alert("Error completing wallet connection.")
    }
  }

  const startConnectionMyAlgo = async (): Promise<void> => {
    try {
      const userAddresses = await myAlgoWalletConnect().connect();
      const userAlgoWallet = userAddresses[0].address;
      //set wallet in state to retrieved wallet, if found, if not throw error
      userAlgoWallet ? setUserConnection(userAlgoWallet, ConnectionTypes.myAlgo) : alert("No found wallet.")
    } catch(err: unknown) {
        alert("Error completing wallet connection.")
    }
  }

  const isConnected = userWalletAddress && connected && connectionType;

  return (
    <div className="App">
      <LoadingScreen loading={loading}/>
      <div className="app-container">
        <h2>Algorand Connector</h2>
        <h6 className="button-header">{isConnected ? `${connectionType} Wallet: ${userWalletAddress}` : "Connect your wallet using Pera or MyAlgo"}</h6>
        <div className={"connect-button-container"}>{"Connect Now"}
          {isConnected ? (
            <TransactionButtons disconnectWallet={disconnectWallet} launchTransaction={launchTransaction} />
          ) : (
            <ConnectButtons startConnectionMyAlgo={startConnectionMyAlgo} startConnectionPera={startConnectionPera} />
          )}
          <h4 className="button-footer">{signedTransaction ? `Signed Transaction:\n${signedTransaction}` : "Please ensure you are connected to TestNet"}</h4>
        </div>
      </div>
    </div>
  );
}

export default App;
