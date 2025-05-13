import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeypairWallet, SolanaAgentKit } from 'solana-agent-kit';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import MiscPlugin from '@solana-agent-kit/plugin-misc';

export interface ParseAccountResponse {
  status: 'success' | 'error';
  message: string;
  programName: string;
  inputAmount: string;
  inputToken: string;
  outputAmount: string;
  outputToken: string;
}

type SolanaAgentMethods = {
  parseTransaction: (signature: string) => Promise<any>;
  getAssetsByOwner: (contractAddress: string) => Promise<any>;
};

type ExtendedSolanaAgentKit = Omit<SolanaAgentKit, 'methods'> & {
  methods: SolanaAgentMethods;
};

@Injectable()
export class ParseService implements OnModuleInit {
  private agent: ExtendedSolanaAgentKit;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeAgent();
  }

  private initializeAgent() {
    const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL');
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const secretKey = this.configService.get<string>('WALLET_KEY');
    const heliusApiKey = this.configService.get<string>('HELIUS_API_KEY');

    if (!rpcUrl || !openAiApiKey || !secretKey) {
      throw new Error('Required environment variables are missing');
    }

    // Create a keypair from a private key
    const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
    const wallet = new KeypairWallet(keyPair, rpcUrl);

    // Initialize with wallet and RPC URL
    this.agent = new SolanaAgentKit(wallet, rpcUrl, {
      OPENAI_API_KEY: openAiApiKey,
      HELIUS_API_KEY: heliusApiKey,
    }).use(MiscPlugin as any) as ExtendedSolanaAgentKit;
  }

  async parseTransaction(signature: string): Promise<ParseAccountResponse> {
    const result = await this.parseSignature(signature);
    // console.log(result);
    return result;
  }

  async parseSignature(signature: string): Promise<ParseAccountResponse> {
    try {
      // Parse transaction using Helius API through Misc Plugin
      const tx = await this.agent.methods.parseTransaction(signature);
      // console.log('Transaction data:', JSON.stringify(tx, null, 2));

      if (!tx || !Array.isArray(tx) || tx.length === 0) {
        throw new Error('Invalid transaction data');
      }

      const transaction = tx[0];
      const tokenTransfers = transaction.tokenTransfers;

      if (!tokenTransfers || !Array.isArray(tokenTransfers)) {
        throw new Error('No token transfers found');
      }

      // Find input and output token transfers
      const inputTransfer = tokenTransfers.find(
        (transfer) => transfer.fromUserAccount === transaction.feePayer,
      );

      const outputTransfer = tokenTransfers.find(
        (transfer) => transfer.toUserAccount === transaction.feePayer,
      );

      if (!inputTransfer || !outputTransfer) {
        throw new Error('Swap transfers not found');
      }

      // Calculate the actual swap amounts
      const inputAmount = inputTransfer.tokenAmount;
      const outputAmount = outputTransfer.tokenAmount;
      const inputTokenMint = inputTransfer.mint;
      const outputTokenMint = outputTransfer.mint;

      const result = {
        inputAmount: inputAmount.toString(),
        inputToken: inputTokenMint,
        outputAmount: outputAmount.toString(),
        outputToken: outputTokenMint,
      };

      // console.log('Parse result:', result);
      return {
        status: 'success',
        message: 'Swap transaction parsed successfully',
        programName: transaction.type,
        ...result,
      };
    } catch (error) {
      console.error('Error parsing transaction:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  async getContractAssets(contractAddress: string): Promise<any> {
    try {
      const assets = await this.agent.methods.getAssetsByOwner(contractAddress);
      // console.log(assets);

      const simplifiedAssets = assets
        .filter((asset) => {
          // FungibleToken 인터페이스만 필터링
          return asset.interface === 'FungibleToken' && asset.token_info;
        })
        .map((asset) => ({
          symbol: asset.token_info?.symbol || 'Unknown',
          account: asset.token_info?.associated_token_address || asset.id,
          balance: asset.token_info?.balance?.toString() || '0',
        }));

      return {
        status: 'success',
        message: 'Contract assets retrieved successfully',
        data: simplifiedAssets,
      };
    } catch (error) {
      console.error('Error getting contract assets:', error);
      throw error;
    }
  }
}
