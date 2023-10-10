import { useEffect, useState } from 'react';
import { UnsignedTransaction } from '@substrate/txwrapper-polkadot';
import { useUnit } from 'effector-react';

import { SigningProps } from '@renderer/features/operation';
import { ValidationErrors } from '@renderer/shared/lib/utils';
import { useTransaction } from '@renderer/entities/transaction';
import { useI18n } from '@renderer/app/providers';
import { Button, ConfirmModal, FootnoteText, SmallTitleText, StatusModal } from '@renderer/shared/ui';
import { wcModel, DEFAULT_POLKADOT_METHODS, getWalletConnectChains } from '@renderer/entities/walletConnect';
import { chainsService } from '@renderer/entities/network';
import { Countdown } from './Countdown';
import { useCountdown } from '@renderer/shared/lib/hooks';
import wallet_connect_confirm from '@video/wallet_connect_confirm.mp4';
import wallet_connect_confirm_webm from '@video/wallet_connect_confirm.webm';
import { HexString } from '@renderer/shared/core';
import { walletModel } from '@renderer/entities/wallet';
import Animations from '@renderer/shared/ui/Animation/Data';
import { Animation } from '@renderer/shared/ui/Animation/Animation';

export const WalletConnect = ({ api, validateBalance, onGoBack, accounts, transactions, onResult }: SigningProps) => {
  const { t } = useI18n();
  const { verifySignature, createPayload } = useTransaction();
  const [countdown, resetCountdown] = useCountdown(api);

  const session = useUnit(wcModel.$session);
  const client = useUnit(wcModel.$client);
  const connect = useUnit(wcModel.events.connect);
  const sessionUpdated = useUnit(wcModel.events.sessionUpdated);

  const chains = chainsService.getChainsData();

  const [txPayload, setTxPayload] = useState<Uint8Array>();
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction>();
  const [isNeedUpdate, setIsNeedUpdate] = useState<boolean>(false);
  const [isReconnectModalOpen, setIsReconnectModalOpen] = useState<boolean>(false);
  const [isReconnectingModalOpen, setIsReconnectingModalOpen] = useState<boolean>(false);
  const [isConnectedModalOpen, setIsConnectedModalOpen] = useState<boolean>(false);

  const transaction = transactions[0];
  const account = accounts[0];

  useEffect(() => {
    if (txPayload || !client) return;

    (async () => {
      const isCurrentSession = session && account && session.topic === account.signingExtras?.sessionTopic;

      if (isCurrentSession) {
        setupTransaction().catch(() => console.warn('WalletConnect | setupTransaction() failed'));
      } else {
        const sessions = client.session.getAll();

        const storedSession = sessions.find((s) => s.topic === account.signingExtras?.sessionTopic);

        if (storedSession) {
          sessionUpdated(storedSession);
          setIsNeedUpdate(true);

          setupTransaction().catch(() => console.warn('WalletConnect | setupTransaction() failed'));
        } else {
          setIsReconnectModalOpen(true);
        }
      }
    })();
  }, [transaction, api]);

  useEffect(() => {
    if (isNeedUpdate) {
      setIsNeedUpdate(false);

      if (session?.topic) {
        walletModel.events.sessionTopicUpdated(session?.topic);
      }
    }
  }, [session]);

  useEffect(() => {
    if (unsignedTx) {
      signTransaction();
    }
  }, [unsignedTx]);

  useEffect(() => {
    if (isReconnectingModalOpen && session?.topic === account.signingExtras?.sessionTopic) {
      setIsReconnectingModalOpen(false);
      setIsConnectedModalOpen(true);
    }
  }, [isReconnectingModalOpen]);

  const setupTransaction = async (): Promise<void> => {
    try {
      const { payload, unsigned } = await createPayload(transaction, api);

      setTxPayload(payload);
      setUnsignedTx(unsigned);

      if (payload) {
        resetCountdown();
      }
    } catch (error) {
      console.warn(error);
    }
  };

  const [_, setValidationError] = useState<ValidationErrors>();

  const reconnect = async () => {
    setIsReconnectModalOpen(false);
    setIsReconnectingModalOpen(true);

    connect({
      chains: getWalletConnectChains(chains),
      pairing: { topic: account.signingExtras?.pairingTopic },
    });

    setIsNeedUpdate(true);
  };

  const handleReconnect = () => {
    reconnect()
      .then(setupTransaction)
      .catch(() => console.warn('WalletConnect | setupTransaction() failed'));
  };

  const signTransaction = async () => {
    if (!api || !client || !session) return;

    try {
      const result = await client.request<{
        payload: string;
        signature: HexString;
      }>({
        // eslint-disable-next-line i18next/no-literal-string
        chainId: `polkadot:${transaction.chainId.slice(2, 34)}`,
        topic: session.topic,
        request: {
          method: DEFAULT_POLKADOT_METHODS.POLKADOT_SIGN_TRANSACTION,
          params: {
            address: transaction.address,
            transactionPayload: unsignedTx,
          },
        },
      });

      if (result.signature) {
        handleSignature(result.signature);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSignature = async (signature: HexString) => {
    const isVerified = txPayload && verifySignature(txPayload, signature as HexString, accounts[0].accountId);

    const balanceValidationError = validateBalance && (await validateBalance());

    if (isVerified && balanceValidationError) {
      setValidationError(balanceValidationError || ValidationErrors.INVALID_SIGNATURE);
    } else {
      if (unsignedTx) {
        onResult([signature], [unsignedTx]);
      }
    }
  };

  const walletName = session?.peer.metadata.name || t('operation.walletConnect.defaultWalletName');

  return (
    <div className="flex flex-col items-center p-4 gap-y-2.5 w-[440px] rounded-b-lg">
      <SmallTitleText>
        {t('operation.walletConnect.signTitle', {
          walletName,
        })}
      </SmallTitleText>

      <Countdown countdown={countdown} />

      <video className="object-contain h-[240px]" autoPlay loop>
        <source src={wallet_connect_confirm_webm} type="video/webm" />
        <source src={wallet_connect_confirm} type="video/mp4" />
      </video>

      <div className="flex w-full justify-between mt-5">
        <Button variant="text" onClick={onGoBack}>
          {t('operation.goBackButton')}
        </Button>
      </div>

      <ConfirmModal
        panelClass="w-[300px]"
        isOpen={isReconnectModalOpen}
        confirmText={t('operation.walletConnect.reconnect.confirmButton')}
        cancelText={t('operation.walletConnect.reconnect.cancelButton')}
        onClose={onGoBack}
        onConfirm={handleReconnect}
      >
        <SmallTitleText align="center">
          {t('operation.walletConnect.reconnect.title', {
            walletName,
          })}
        </SmallTitleText>
        <FootnoteText className="mt-2 text-text-tertiary" align="center">
          {t('operation.walletConnect.reconnect.description')}
        </FootnoteText>
      </ConfirmModal>

      <StatusModal
        title={t('operation.walletConnect.reconnect.reconnecting')}
        isOpen={isReconnectingModalOpen}
        content={<Animation animation={Animations.loading} loop />}
        onClose={onGoBack}
      />

      <StatusModal
        title={t('operation.walletConnect.reconnect.connected')}
        isOpen={isConnectedModalOpen}
        content={<Animation animation={Animations.success} />}
        onClose={() => setIsConnectedModalOpen(false)}
      />
    </div>
  );
};
