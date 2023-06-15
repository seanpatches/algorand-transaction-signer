import React, { FC } from 'react';

type TransactionButtonsProps = {
  launchTransaction: () => void,
  disconnectWallet: () => void,
};

const TransactionButtons: FC<TransactionButtonsProps> = ({ launchTransaction, disconnectWallet }) => {

  return (
    <div>
      <button onClick={launchTransaction}>Test Transaction</button>
      <button onClick={disconnectWallet}>Test Transaction</button>
    </div>
  )
}

export default TransactionButtons;