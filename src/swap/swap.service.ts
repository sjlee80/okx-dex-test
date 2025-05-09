import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SolanaAgentKit, KeypairWallet } from 'solana-agent-kit';
import TokenPlugin from '@solana-agent-kit/plugin-token';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { CreateSwapDto } from './dto/req.dto';

type SolanaAgentMethods = {
  get_balance: () => Promise<number>;
  get_token_balance: (tokenMint: string) => Promise<number>;
  get_balance_other: (walletAddress: string) => Promise<number>;
  trade: (
    outputMint: PublicKey,
    amount: number,
    inputMint?: PublicKey,
    slippage?: number,
  ) => Promise<string>;
};

type ExtendedSolanaAgentKit = Omit<SolanaAgentKit, 'methods'> & {
  methods: SolanaAgentMethods;
};

export interface TokenBalance {
  tokenAddress: string;
  walletAddress: string;
  balance: string;
  decimals?: number;
}

export interface SolBalance {
  address: string;
  balance: number;
  rawBalance: number;
}

@Injectable()
export class SwapService implements OnModuleInit {
  private agent: ExtendedSolanaAgentKit;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeAgent();
  }

  private initializeAgent() {
    const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL');
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const secretKey = this.configService.get<string>('WALLET_KEY');

    if (!rpcUrl || !openAiApiKey || !secretKey) {
      throw new Error('Required environment variables are missing');
    }

    // Create a keypair from a private key
    const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
    const wallet = new KeypairWallet(keyPair, rpcUrl);

    // Initialize with wallet and RPC URL
    this.agent = new SolanaAgentKit(wallet, rpcUrl, {
      OPENAI_API_KEY: openAiApiKey,
    }).use(TokenPlugin) as unknown as ExtendedSolanaAgentKit;
  }

  async getBalance() {
    try {
      const balance = await this.agent.methods.get_balance();
      return balance;
    } catch (error) {
      throw new Error(
        `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async trade(createSwapDto: CreateSwapDto) {
    try {
      const { outputMint, amount, inputMint, slippage } = createSwapDto;

      const outputMintPubkey = new PublicKey(outputMint);
      const inputMintPubkey = inputMint ? new PublicKey(inputMint) : undefined;

      const signature = await this.agent.methods.trade(
        outputMintPubkey,
        amount,
        inputMintPubkey,
        slippage,
      );

      return {
        status: 'success',
        signature,
        message: 'Trade executed successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to execute trade: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
