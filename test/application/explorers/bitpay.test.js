import { getBitpayTransaction } from '../../../src/explorers/bitcoin/bitpay';
import sinon from 'sinon';
import * as RequestService from '../../../src/services/request';
import * as mockBitpayResponse from './mocks/mockBitpayResponse';

describe('BitPay class test suite', function () {
  const fixtureTransactionId = '2378076e8e140012814e98a2b2cb1af07ec760b239c1d6d93ba54d658a010ecd';
  const assertionRequestUrl = `https://insight.bitpay.com/api/tx/${fixtureTransactionId}`;
  let stubRequest;
  let assertionResponse = {
    'issuingAddress': '1AwdUWQzJgfDDjeKtpPzMfYMHejFBrxZfo',
    'remoteHash': 'b2ceea1d52627b6ed8d919ad1039eca32f6e099ef4a357cbb7f7361c471ea6c8',
    'revokedAddresses': ['1AwdUWQzJgfDDjeKtpPzMfYMHejFBrxZfo'],
    'time': 1518049414
  };

  beforeEach(function () {
    stubRequest = sinon.stub(RequestService, 'request').resolves(JSON.stringify(mockBitpayResponse));
  });

  afterEach(function () {
    stubRequest.restore();
  });

  describe('getBitpayTransaction method', function () {
    it('should call the right request API', function () {
      getBitpayTransaction(fixtureTransactionId).then(() => {
        expect(stubRequest.getCall(0).args).toEqual([{ url: assertionRequestUrl }]);
      });
    });

    describe('given the API request failed', function () {
      it('should throw the right error', async function () {
        const fixtureError = new Error('Unable to get remote hash');
        stubRequest.rejects(fixtureError);
        await getBitpayTransaction(fixtureTransactionId).catch(err => {
          expect(err).toEqual(fixtureError);
        });
      });
    });

    describe('given the request is successful', function () {
      describe('and the transaction data is generated from the response', function () {
        it('should return a correct transaction data', async function () {
          getBitpayTransaction(fixtureTransactionId).then(res => {
            expect(res).toEqual(assertionResponse);
          });
        });
      });

      describe('and the transaction does not have enough confirmations yet', function () {
        it('should throw the right error', async function () {
          stubRequest.resolves(JSON.stringify({
            ...mockBitpayResponse,
            confirmations: 0
          }));
          await expect(getBitpayTransaction(fixtureTransactionId)).rejects.toEqual(new Error('Number of transaction confirmations were less than the minimum required, according to Bitpay API'));
        });
      });
    });
  });
});
