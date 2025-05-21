import { Injectable } from '@nestjs/common';
import { OKXDexClient } from '@okx-dex/okx-dex-sdk';
import { ConfigService } from '@nestjs/config';
import { createWallet } from './util/wallet';
import { Connection } from '@solana/web3.js';
import { inspect } from 'util';

@Injectable()
export class OkxService {
  private readonly client: OKXDexClient;
  private readonly wallet: any;

  constructor(private configService: ConfigService) {
    const connection = new Connection(
      this.configService.get<string>('SOLANA_RPC_URL'),
    );

    this.wallet = createWallet(
      this.configService.get<string>('WALLET_KEY'),
      connection,
    );

    this.client = new OKXDexClient({
      apiKey: this.configService.get<string>('OKX_API_KEY')!,
      secretKey: this.configService.get<string>('OKX_SECRET_KEY')!,
      apiPassphrase: this.configService.get<string>('OKX_API_PASSPHRASE')!,
      projectId: this.configService.get<string>('OKX_PROJECT_ID')!,
      solana: {
        wallet: this.wallet,
        computeUnits: 1000000,
        maxRetries: 10,
      },
    });
  }

  async findAll() {
    const chainData = await this.client.dex.getChainData('501');
    console.log(
      'Supported tokens:',
      inspect(chainData, { depth: null, colors: true }),
    );

    return chainData;
  }

  async getQuote(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
  ) {
    console.log('Getting quote for:', fromTokenAddress, toTokenAddress, amount);

    try {
      const rawAmount = (parseFloat(amount) * Math.pow(10, 9)).toString();
      console.log('Raw amount:', rawAmount);

      const quote = await this.client.dex.getQuote({
        chainId: '501',
        fromTokenAddress,
        toTokenAddress,
        amount: rawAmount,
        slippage: '1',
      });

      console.log('Quote:', quote);

      const tokenInfo = {
        fromToken: {
          symbol: quote.data[0].fromToken.tokenSymbol,
          decimals: parseInt(quote.data[0].fromToken.decimal),
          price: quote.data[0].fromToken.tokenUnitPrice,
        },
        toToken: {
          symbol: quote.data[0].toToken.tokenSymbol,
          decimals: parseInt(quote.data[0].toToken.decimal),
          price: quote.data[0].toToken.tokenUnitPrice,
        },
      };

      return {
        fromToken: tokenInfo.fromToken,
        toToken: tokenInfo.toToken,
        amount: amount,
        rawAmount: rawAmount,
        usdValue: (
          parseFloat(amount) * parseFloat(tokenInfo.fromToken.price)
        ).toFixed(2),
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error;
    }
  }

  async executeSwap(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
  ) {
    try {
      console.log('Getting token information...');
      const quote = await this.getQuote(
        fromTokenAddress,
        toTokenAddress,
        amount,
      );

      console.log('\nSwap Details:');
      console.log('--------------------');
      console.log(`From: ${quote.fromToken.symbol}`);
      console.log(`To: ${quote.toToken.symbol}`);
      console.log(`Amount: ${amount} ${quote.fromToken.symbol}`);
      console.log(`Amount in base units: ${quote.rawAmount}`);
      console.log(`Approximate USD value: $${quote.usdValue}`);

      // Execute the swap
      console.log('\nExecuting swap...');
      try {
        const result = await this.client.dex.executeSwap({
          chainId: '501',
          fromTokenAddress,
          toTokenAddress,
          amount: quote.rawAmount,
          slippage: '0.2',
          userWalletAddress: this.wallet.publicKey.toString(),
        });

        if (result.transactionId) {
          console.log('\nSwap transaction submitted!');
          console.log('Transaction ID:', result.transactionId);
          console.log('Explorer URL:', result.explorerUrl);

          return {
            status: 'submitted',
            transactionId: result.transactionId,
            explorerUrl: result.explorerUrl,
            message:
              'Transaction has been submitted. Please check the status in Explorer.',
          };
        }
      } catch (swapError: any) {
        // Handle as success if transaction signature exists
        if (swapError.signature) {
          console.log('\nSwap transaction submitted!');
          console.log('Transaction signature:', swapError.signature);
          console.log(
            'Explorer URL:',
            `https://solscan.io/tx/${swapError.signature}`,
          );

          return {
            status: 'submitted',
            signature: swapError.signature,
            explorerUrl: `https://solscan.io/tx/${swapError.signature}`,
            message:
              'Transaction has been submitted. Please check the status in Explorer.',
          };
        }
        throw swapError;
      }

      throw new Error('Transaction submission failed');
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }
}
