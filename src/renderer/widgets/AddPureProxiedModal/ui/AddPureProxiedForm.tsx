import { useForm } from 'effector-forms';
import { FormEvent } from 'react';
import { useUnit } from 'effector-react';

import { Button, Select, Input, InputHint, Alert } from '@shared/ui';
import { useI18n } from '@app/providers';
import { ChainTitle } from '@entities/chain';
import { PureProxyPopover } from '@entities/proxy';
import { AccountAddress, accountUtils } from '@entities/wallet';
import { toAddress, toShortAddress } from '@shared/lib/utils';
import { formModel } from '../model/form-model';
import { AssetBalance } from '@entities/asset';
import { MultisigAccount } from '@shared/core';
import { DropdownOption } from '@shared/ui/types';
import {
  ProxyDepositWithLabel,
  MultisigDepositWithLabel,
  FeeWithLabel,
  DESCRIPTION_LENGTH,
} from '@entities/transaction';

type Props = {
  onGoBack: () => void;
};
export const AddPureProxiedForm = ({ onGoBack }: Props) => {
  const { t } = useI18n();

  const { submit } = useForm(formModel.$proxyForm);

  const submitProxy = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <div className="pb-4 px-5">
      <PureProxyPopover>{t('proxy.pureProxyTooltip.button')}</PureProxyPopover>
      <form id="add-proxy-form" className="flex flex-col gap-y-4 mt-4" onSubmit={submitProxy}>
        <NetworkSelector />
        <AccountSelector />
        <SignatorySelector />
        <DescriptionInput />
      </form>
      <div className="flex flex-col gap-y-6 pt-6 pb-4">
        <FeeSection />
        <FeeError />
      </div>
      <ButtonsSection onGoBack={onGoBack} />
    </div>
  );
};

const NetworkSelector = () => {
  const { t } = useI18n();

  const {
    fields: { chain },
  } = useForm(formModel.$proxyForm);

  const proxyChains = useUnit(formModel.$proxyChains);

  const options = Object.values(proxyChains).map((chain) => ({
    id: chain.chainId,
    value: chain,
    element: (
      <ChainTitle
        className="overflow-hidden"
        fontClass="text-text-primary truncate"
        key={chain.chainId}
        chain={chain}
      />
    ),
  }));

  return (
    <div className="flex flex-col gap-y-2">
      <Select
        label={t('proxy.addProxy.networkLabel')}
        placeholder={t('proxy.addProxy.networkPlaceholder')}
        selectedId={chain.value.chainId}
        invalid={chain.hasError()}
        options={options}
        onChange={({ value }) => chain.onChange(value)}
      />
      <InputHint variant="error" active={chain.hasError()}>
        {t(chain.errorText())}
      </InputHint>
    </div>
  );
};

const AccountSelector = () => {
  const { t } = useI18n();

  const {
    fields: { account, chain },
  } = useForm(formModel.$proxyForm);

  const proxiedAccounts = useUnit(formModel.$proxiedAccounts);

  if (proxiedAccounts.length <= 1) return null;

  const options = proxiedAccounts.map(({ account, balance }) => {
    const isShard = accountUtils.isShardAccount(account);
    const address = toAddress(account.accountId, { prefix: chain.value.addressPrefix });

    return {
      id: account.id.toString(),
      value: account,
      element: (
        <div className="flex justify-between w-full" key={account.id}>
          <AccountAddress
            size={20}
            type="short"
            address={address}
            name={isShard ? toShortAddress(address, 16) : account.name}
            canCopy={false}
          />
          <AssetBalance value={balance} asset={chain.value.assets[0]} />
        </div>
      ),
    };
  });

  return (
    <div className="flex flex-col gap-y-2">
      <Select
        label={t('proxy.addProxy.accountLabel')}
        placeholder={t('proxy.addProxy.accountPlaceholder')}
        selectedId={account.value.id.toString()}
        options={options}
        disabled={options.length === 1}
        onChange={({ value }) => account.onChange(value)}
      />
    </div>
  );
};

const SignatorySelector = () => {
  const { t } = useI18n();

  const {
    fields: { chain, signatory },
  } = useForm(formModel.$proxyForm);

  const signatories = useUnit(formModel.$signatories);
  const isMultisig = useUnit(formModel.$isMultisig);

  if (!isMultisig) return null;

  const options = signatories.reduce<DropdownOption[]>((acc, { signer, balance }) => {
    if (!signer?.id) return acc;

    const isShard = accountUtils.isShardAccount(signer);
    const address = toAddress(signer.accountId, { prefix: chain.value.addressPrefix });

    acc.push({
      id: signer.id.toString(),
      value: signer,
      element: (
        <div className="flex justify-between items-center w-full">
          <AccountAddress
            size={20}
            type="short"
            address={address}
            name={isShard ? address : signer.name}
            canCopy={false}
          />
          <AssetBalance value={balance} asset={chain.value.assets[0]} />
        </div>
      ),
    });

    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-y-2">
      <Select
        label={t('proxy.addProxy.signatoryLabel')}
        placeholder={t('proxy.addProxy.signatoryPlaceholder')}
        selectedId={signatory.value.id.toString()}
        options={options}
        invalid={signatory.hasError()}
        onChange={({ value }) => signatory.onChange(value)}
      />
      <InputHint variant="error" active={signatory.hasError()}>
        {t(signatory.errorText())}
      </InputHint>
    </div>
  );
};

const DescriptionInput = () => {
  const { t } = useI18n();

  const {
    fields: { description },
  } = useForm(formModel.$proxyForm);
  const isMultisig = useUnit(formModel.$isMultisig);

  if (!isMultisig) return null;

  return (
    <div className="flex flex-col gap-y-2">
      <Input
        spellCheck
        label={t('general.input.descriptionLabel')}
        className="w-full"
        placeholder={t('general.input.descriptionPlaceholder')}
        invalid={description.hasError()}
        value={description.value}
        onChange={description.onChange}
      />
      <InputHint variant="error" active={description.hasError()}>
        {description.errorText({
          maxLength: t('proxy.addProxy.maxLengthDescriptionError', { maxLength: DESCRIPTION_LENGTH }),
        })}
      </InputHint>
    </div>
  );
};

const FeeSection = () => {
  const {
    fields: { chain, account },
  } = useForm(formModel.$proxyForm);

  const api = useUnit(formModel.$api);
  const fakeTx = useUnit(formModel.$fakeTx);
  const isMultisig = useUnit(formModel.$isMultisig);

  return (
    <div className="flex flex-col gap-y-2">
      <ProxyDepositWithLabel
        api={api}
        proxyNumber={1}
        deposit={'0'}
        asset={chain.value.assets[0]}
        onDepositChange={formModel.events.proxyDepositChanged}
        onDepositLoading={formModel.events.isProxyDepositLoadingChanged}
      />

      {isMultisig && (
        <MultisigDepositWithLabel
          api={api}
          asset={chain.value.assets[0]}
          threshold={(account.value as MultisigAccount).threshold}
          onDepositChange={formModel.events.multisigDepositChanged}
        />
      )}

      <FeeWithLabel
        api={api}
        asset={chain.value.assets[0]}
        transaction={fakeTx}
        onFeeChange={formModel.events.feeChanged}
        onFeeLoading={formModel.events.isFeeLoadingChanged}
      />
    </div>
  );
};

const FeeError = () => {
  const { t } = useI18n();

  const {
    fields: { account },
  } = useForm(formModel.$proxyForm);

  const isMultisig = useUnit(formModel.$isMultisig);

  return (
    <Alert title={t('proxy.addProxy.balanceAlertTitle')} active={account.hasError()} variant="error">
      <Alert.Item withDot={false}>
        {isMultisig ? t('proxy.addProxy.balanceAlertMultisig') : t('proxy.addProxy.balanceAlertRegular')}
      </Alert.Item>
    </Alert>
  );
};

const ButtonsSection = ({ onGoBack }: Props) => {
  const { t } = useI18n();

  const canSubmit = useUnit(formModel.$canSubmit);

  return (
    <div className="flex justify-between items-center mt-4">
      <Button variant="text" onClick={onGoBack}>
        {t('operation.goBackButton')}
      </Button>
      <Button form="add-proxy-form" type="submit" disabled={!canSubmit}>
        {t('operation.continueButton')}
      </Button>
    </div>
  );
};
