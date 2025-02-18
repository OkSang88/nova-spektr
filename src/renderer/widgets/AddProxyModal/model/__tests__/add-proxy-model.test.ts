import { allSettled, fork } from 'effector';
import { UnsignedTransaction } from '@substrate/txwrapper-polkadot';

import { networkModel } from '@entities/network';
import { walletModel } from '@entities/wallet';
import { signModel } from '@features/operations/OperationSign/model/sign-model';
import { submitModel } from '@features/operations/OperationSubmit';
import { storageService } from '@shared/api/storage';
import { initiatorWallet, signerWallet, testApi, testChain } from './mock';
import { Account, ConnectionStatus, ProxyType } from '@shared/core';
import { Step } from '../../lib/types';
import { formModel } from '../form-model';
import { confirmModel } from '../confirm-model';
import { addProxyModel } from '../add-proxy-model';

jest.mock('@shared/lib/utils', () => ({
  ...jest.requireActual('@shared/lib/utils'),
  getProxyTypes: jest.fn().mockReturnValue(['Any', 'Staking']),
}));

describe('widgets/AddPureProxyModal/model/add-proxy-model', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('should go through the process of proxy create', async () => {
    jest.spyOn(storageService.proxies, 'createAll').mockResolvedValue([]);
    jest.spyOn(storageService.proxyGroups, 'createAll').mockResolvedValue([]);
    jest.spyOn(storageService.proxies, 'updateAll').mockResolvedValue([]);
    jest.spyOn(storageService.proxyGroups, 'updateAll').mockResolvedValue([]);

    const scope = fork({
      values: new Map()
        .set(networkModel.$apis, { '0x00': testApi })
        .set(networkModel.$chains, { '0x00': testChain })
        .set(networkModel.$connectionStatuses, { '0x00': ConnectionStatus.CONNECTED })
        .set(walletModel.$wallets, [initiatorWallet, signerWallet]),
    });

    await allSettled(addProxyModel.events.flowStarted, { scope });

    expect(scope.getState(addProxyModel.$chain)).toEqual(undefined);
    expect(scope.getState(addProxyModel.$step)).toEqual(Step.INIT);

    await allSettled(formModel.output.formSubmitted, {
      scope,
      params: {
        proxyDeposit: '1',
        oldProxyDeposit: '0',
        proxyNumber: 1,
        chain: testChain,
        account: { accountId: '0x00' } as unknown as Account,
        delegate: '0x00',
        proxyType: ProxyType.ANY,
        description: '',
      },
    });

    expect(scope.getState(addProxyModel.$step)).toEqual(Step.CONFIRM);

    await allSettled(confirmModel.output.formSubmitted, { scope });

    expect(scope.getState(addProxyModel.$step)).toEqual(Step.SIGN);

    await allSettled(signModel.output.formSubmitted, {
      scope,
      params: {
        signatures: ['0x00'],
        unsignedTxs: [{}] as unknown as UnsignedTransaction[],
      },
    });

    expect(scope.getState(addProxyModel.$step)).toEqual(Step.SUBMIT);

    const action = allSettled(submitModel.output.formSubmitted, {
      scope,
      params: {
        timepoint: {
          height: 1,
          index: 1,
        },
        extrinsicHash: '0x00',
        isFinalApprove: true,
        multisigError: '',
      },
    });

    await jest.runAllTimersAsync();
    await action;

    expect(scope.getState(addProxyModel.$step)).toEqual(Step.NONE);
  });
});
