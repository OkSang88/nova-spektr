import QRCodeStyling from 'qr-code-styling';
import { useEffect, useRef, useState } from 'react';
import { useUnit } from 'effector-react';

import { useI18n } from '@renderer/app/providers';
import { BaseModal, HeaderTitleText, SmallTitleText } from '@renderer/shared/ui';
import ManageStep from './ManageStep/ManageStep';
import novawallet_onboarding_tutorial from '@video/novawallet_onboarding_tutorial.mp4';
import novawallet_onboarding_tutorial_webm from '@video/novawallet_onboarding_tutorial.webm';
import { usePrevious } from '@renderer/shared/lib/hooks';
import * as walletConnectModel from '@renderer/entities/walletConnect';
import { chainsService } from '@renderer/entities/network';
import { wcOnboardingModel } from './model/walletConnectOnboarding';
import { Step, WCQRConfig } from './common/const';
import { useStatusContext } from '@renderer/app/providers/context/StatusContext';

type Props = {
  isOpen: boolean;
  size?: number;
  onClose: () => void;
  onComplete: () => void;
};

const qrCode = new QRCodeStyling(WCQRConfig);

const WalletConnect = ({ isOpen, onClose, onComplete }: Props) => {
  const { t } = useI18n();

  const { showStatus } = useStatusContext();

  const session = useUnit(walletConnectModel.$session);
  const client = useUnit(walletConnectModel.$client);
  const pairings = useUnit(walletConnectModel.$pairings);
  const uri = useUnit(walletConnectModel.$uri);
  const connect = useUnit(walletConnectModel.events.connect);
  const disconnect = useUnit(walletConnectModel.events.disconnect);
  const step = useUnit(wcOnboardingModel.$step);
  const startOnboarding = useUnit(wcOnboardingModel.events.startOnboarding);

  const previousPairings = usePrevious(pairings);

  const [pairingTopic, setPairingTopic] = useState<string>();

  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current);
    }
  }, []);

  useEffect(() => {
    qrCode.update({
      data: uri,
    });
  }, [uri]);

  useEffect(() => {
    if (isOpen) {
      startOnboarding();
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === Step.REJECT) {
      showStatus({
        title: t('onboarding.walletConnect.rejected'),
        content: <></>,
      });
      onClose();
    }
  }, [step]);

  useEffect(() => {
    if (client && isOpen) {
      const chains = walletConnectModel.getWalletConnectChains(chainsService.getChainsData());
      connect({ chains });
    }
  }, [client, isOpen]);

  useEffect(() => {
    const newPairing = pairings?.find((p) => !previousPairings?.find((pp) => pp.topic === p.topic));

    if (newPairing) {
      setPairingTopic(newPairing.topic);
    }
  }, [pairings.length]);

  return (
    <BaseModal
      closeButton
      isOpen={isOpen}
      contentClass="flex h-full"
      panelClass="w-[944px] h-[576px]"
      onClose={onClose}
    >
      {step === Step.SCAN && qrCode && (
        <>
          <div className="w-[472px] flex flex-col px-5 py-4 bg-white rounded-l-lg">
            <HeaderTitleText className="mb-10">{t('onboarding.walletConnect.title')}</HeaderTitleText>
            <SmallTitleText className="mb-6">{t('onboarding.walletConnect.scanTitle')}</SmallTitleText>

            <div className="flex items-center justify-center">
              <div ref={ref}></div>
            </div>
          </div>

          <div className="w-[472px] flex flex-col bg-black">
            <video className="object-contain h-full" autoPlay loop>
              <source src={novawallet_onboarding_tutorial_webm} type="video/webm" />
              <source src={novawallet_onboarding_tutorial} type="video/mp4" />
            </video>
          </div>
        </>
      )}

      {step === Step.MANAGE && session && pairingTopic && (
        <ManageStep
          accounts={session.namespaces.polkadot.accounts}
          pairingTopic={pairingTopic}
          sessionTopic={session.topic}
          onBack={disconnect}
          onComplete={onComplete}
        />
      )}
    </BaseModal>
  );
};

export default WalletConnect;
