import { chainsService } from '../chainsService';
import type { Chain } from '@renderer/shared/core';
import { fakeBalance, getChain, fakePrice } from './TestHelpers';

describe('service/chainsService', () => {
  let polkadot: Chain = getChain('Polkadot');
  let kusama: Chain = getChain('Kusama');
  let threeDPass: Chain = getChain('3DPass');
  let westend: Chain = getChain('Westend');
  let acala: Chain = getChain('Acala');
  let interlay: Chain = getChain('Interlay');
  let bifrostKusama: Chain = getChain('Bifrost Kusama');
  let litmus: Chain = getChain('Litmus');
  let kusamaAssetHub: Chain = getChain('Kusama Asset Hub');
  let polkadotAssetHub: Chain = getChain('Polkadot Asset Hub');

  test('should init', () => {
    expect(chainsService.sortChains).toBeDefined();
    expect(chainsService.sortChainsByBalance).toBeDefined();
    expect(chainsService.getChainsData).toBeDefined();
    expect(chainsService.getStakingChainsData).toBeDefined();
  });

  test.each([
    [
      'Polkadot => Kusama => Parachains => TestNets',
      [westend, polkadot, threeDPass, acala, kusama],
      [polkadot, kusama, acala, threeDPass, westend],
    ],
    ['Polkadot => Kusama => Testnets', [westend, kusama, polkadot], [polkadot, kusama, westend]],
    ['Polkadot => Kusama => Parachains', [acala, kusama, polkadot], [polkadot, kusama, acala]],
    ['Polkadot => Parachains', [polkadot, litmus, acala], [polkadot, acala, litmus]],
    ['Acala => 3DPass', [threeDPass, acala], [acala, threeDPass]],
  ])('should sort chains without prices - %s', (_, notSortedChains, expectedOrder) => {
    const sortedChains = chainsService.sortChains(notSortedChains);
    expect(sortedChains.map((chain) => chain.name)).toEqual(expectedOrder.map((chain) => chain.name));
  });

  test.each([
    [
      'Polkadot 100$ => Kusama 10$',
      [polkadot, kusama],
      [fakeBalance(polkadot, 'DOT', '100'), fakeBalance(kusama, 'KSM', '10')],
      fakePrice({ DOT: 1, KSM: 1 }, [polkadot, kusama]),
      [polkadot, kusama],
    ],
    [
      'Kusama 100$ => Polkadot 10$',
      [polkadot, kusama],
      [fakeBalance(polkadot, 'DOT', '10'), fakeBalance(kusama, 'KSM', '100')],
      fakePrice({ DOT: 1, KSM: 1 }, [polkadot, kusama]),
      [kusama, polkadot],
    ],
    [
      'Kusama 10$ => Polkadot 10$',
      [polkadot, kusama],
      [fakeBalance(polkadot, 'DOT', '10'), fakeBalance(kusama, 'KSM', '10')],
      fakePrice({ DOT: 1, KSM: 1 }, [polkadot, kusama]),
      [kusama, polkadot],
    ],
  ])('Dotsama group with balances - %s', (_, notSortedChains, balances, prices, expectedOrder) => {
    const sortedChains = chainsService.sortChainsByBalance(notSortedChains, balances, prices, 'usd');

    expect(sortedChains.map((chain) => chain.name)).toEqual(expectedOrder.map((chain) => chain.name));
  });

  test.each([
    [
      'Bifrost Kusama BNC 100$ => Interlay INTR 10$',
      [interlay, bifrostKusama, threeDPass],
      [fakeBalance(interlay, 'INTR', '100'), fakeBalance(bifrostKusama, 'BNC', '10')],
      fakePrice({ INTR: 1, BNC: 1 }, [interlay, bifrostKusama]),
      [bifrostKusama, interlay, threeDPass],
    ],
    [
      'Interlay INTR 100$ => Bifrost Kusama BNC 10$',
      [threeDPass, bifrostKusama, interlay],
      [fakeBalance(interlay, 'INTR', '100'), fakeBalance(bifrostKusama, 'BNC', '10')],
      fakePrice({ INTR: 1, BNC: 1 }, [interlay, bifrostKusama]),
      [interlay, bifrostKusama, threeDPass],
    ],
    [
      'Bifrost Kusama BNC 0.1$ => Interlay INTR 0.01$',
      [threeDPass, interlay, bifrostKusama],
      [fakeBalance(interlay, 'INTR', '1'), fakeBalance(bifrostKusama, 'BNC', '1')],
      fakePrice({ INTR: 0.01, BNC: 0.1 }, [interlay, bifrostKusama]),
      [bifrostKusama, interlay, threeDPass],
    ],
    [
      'Bifrost Kusama BNC 0.1$ => Kusama Asset Hub KSM 0$',
      [threeDPass, bifrostKusama, kusamaAssetHub],
      [fakeBalance(kusamaAssetHub, 'KSM', '1'), fakeBalance(bifrostKusama, 'BNC', '1')],
      fakePrice({ KSM: 0, BNC: 0.1 }, [kusamaAssetHub, bifrostKusama]),
      [bifrostKusama, kusamaAssetHub, threeDPass],
    ],
    [
      'Bifrost Kusama BNC 1$ => Polkadot Asset Hub DOT 0.1$',
      [threeDPass, bifrostKusama, polkadotAssetHub],
      [fakeBalance(polkadotAssetHub, 'DOT', '1'), fakeBalance(bifrostKusama, 'BNC', '1')],
      fakePrice({ DOT: 0.1, BNC: 1 }, [polkadotAssetHub, bifrostKusama]),
      [bifrostKusama, polkadotAssetHub, threeDPass],
    ],
    [
      'Litmus LIT 1$ => Interlay INTR 0.1$ => Bifrost Kusama BNC 0.1$',
      [litmus, interlay, bifrostKusama],
      [fakeBalance(litmus, 'LIT', '1'), fakeBalance(interlay, 'INTR', '1'), fakeBalance(bifrostKusama, 'BNC', '1')],
      fakePrice({ INTR: 0.1, BNC: 0.1, LIT: 1 }, [litmus, interlay, bifrostKusama]),
      [litmus, interlay, bifrostKusama],
    ],
  ])('Parachain networks group with balances - %s', (_, notSortedChains, balances, prices, expectedOrder) => {
    const sortedChains = chainsService.sortChainsByBalance(notSortedChains, balances, prices, 'usd');

    expect(sortedChains.map((chain) => chain.name)).toEqual(expectedOrder.map((chain) => chain.name));
  });
});
