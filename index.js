require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

// Uniswap V2 Factory and Router contract addresses (Ethereum Mainnet)
const UNISWAP_V2_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const UNISWAP_V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739df2C5dAcb4c659F2488D';
// ABI snippets for the Uniswap V2 Factory and Router
const UNISWAP_V2_FACTORY_ABI = [
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
];
const UNISWAP_V2_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
];

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const uniswapFactory = new ethers.Contract(UNISWAP_V2_FACTORY_ADDRESS, UNISWAP_V2_FACTORY_ABI, provider);

async function listenForNewTokenListings() {
  uniswapFactory.on('PairCreated', async (token0, token1, pairAddress) => {
    console.log(`New Pair Created: ${token0} & ${token1} at ${pairAddress}`);
    // Example logic to decide if you want to snipe one of these tokens
    // Here, we simply choose token1 as the target
    await snipeToken(token1);
  });
}

async function snipeToken(tokenAddress) {
  console.log(`Attempting to snipe token: ${tokenAddress}`);
  
  const router = new ethers.Contract(UNISWAP_V2_ROUTER_ADDRESS, UNISWAP_V2_ROUTER_ABI, wallet);
  const amountOutMin = '0'; // Set to a reasonable minimum amount of tokens expected
  const path = [ethers.constants.AddressZero, tokenAddress]; // ETH to Token swap
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
  const tx = await router.swapExactETHForTokens(amountOutMin, path, wallet.address, deadline, {
    value: ethers.utils.parseEther('1'), // Swap 1 ETH for Tokens
  });

  console.log(`Transaction Hash: ${tx.hash}`);
  await tx.wait();
  console.log(`Sniped ${tokenAddress} successfully.`);
}

listenForNewTokenListings();
