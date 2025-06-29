import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeContext";
import { ethers } from "ethers";
import ConnectWallet from "./components/ConnectWallet";
import Register from "./components/Register";
import MarketPlace from "./components/MarketPlace";
import Navbar from "./components/Navbar";
import EnergyRecords from "./components/EnergyRecords";
import "./App.css";
import ProducerDashboard from "./components/dashboard/ProducerDashboard";
import ConsumerDashboard from "./components/dashboard/ConsumerDashboard";

// Contract ABI and Address
const CONTRACT_ABI =[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "consumer",
				"type": "address"
			}
		],
		"name": "acceptRequest",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "activateSupply",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "consumers",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "registered",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "deactivateSupply",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "deposit",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllProducers",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			},
			{
				"internalType": "bool[]",
				"name": "",
				"type": "bool[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "consumer",
				"type": "address"
			}
		],
		"name": "getConsumerBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "producer",
				"type": "address"
			}
		],
		"name": "getProducerBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "producer",
				"type": "address"
			}
		],
		"name": "getRequestDetails",
		"outputs": [
			{
				"internalType": "address",
				"name": "consumer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "rate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "requestTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "acceptTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "settleTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "requestedAmount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "getTransaction",
		"outputs": [
			{
				"internalType": "address",
				"name": "producer",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "consumer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "duration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTransactionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "producer",
				"type": "address"
			}
		],
		"name": "isSupplyActive",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "producerAddresses",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "producers",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "rate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "registered",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "supplyActive",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "registerConsumer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "registerProducer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "producer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "requestEnergy",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "requests",
		"outputs": [
			{
				"internalType": "address",
				"name": "consumer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "rate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "requestTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "acceptTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "settleTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "requestedAmount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_rate",
				"type": "uint256"
			}
		],
		"name": "setRate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "producer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "deliveredAmount",
				"type": "uint256"
			}
		],
		"name": "settlePayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "producer",
				"type": "address"
			}
		],
		"name": "terminateRequest",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "transactionHistory",
		"outputs": [
			{
				"internalType": "address",
				"name": "producer",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "consumer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "duration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawBalance",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawProducerBalance",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
// const CONTRACT_ADDRESS = "0x48045fdA47735bB0c0fbD21ae3318a8E7847B0b3"; // Replace with your actual contract address
// const CONTRACT_ADDRESS = "0x4753Ec9F4CDa970a6E6E6326041394A0B727Fb21"; // Replace with your actual contract address
// const CONTRACT_ADDRESS = "0x5ec0749097ae546d1286EA61311A688A3FfCc09f"; // Replace with your actual contract address
const CONTRACT_ADDRESS = "0x12158B9216111769871377F36b99cD8F1893E9F5"; // Replace with your actual contract address

function App() {
   const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [userType, setUserType] = useState(null); // 'producer' or 'consumer'
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadingUserType, setLoadingUserType] = useState(false);


  // Initialize contract when provider is available
  useEffect(() => {
    const initializeContract = async () => {
      if (provider && account) {
        try {
          const signer = await provider.getSigner();
          const energyContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
          );
          setContract(energyContract);
        } catch (error) {
          console.error("Error initializing contract:", error);
        }
      }
    };

    initializeContract();
  }, [provider, account]);

  // Refresh data when account changes
useEffect(() => {
    const checkUserRegistration = async () => {
      if (contract && account) {
        setLoadingUserType(true);
        try {
          const [isProducer, isConsumer] = await Promise.all([
            contract.producers(account).then(p => p.registered),
            contract.consumers(account).then(c => c.registered)
          ]);

          if (isProducer) {
            setUserType('producer');
          } else if (isConsumer) {
            setUserType('consumer');
          } else {
            setUserType(null);
          }
        } catch (error) {
          console.error("Error checking user registration:", error);
          setUserType(null);
        } finally {
          setLoadingUserType(false);
        }
      }
    };

    checkUserRegistration();
  }, [contract, account, refreshTrigger]);


return (
    <ThemeProvider>
      <Navbar 
        account={account}
        userType={userType}
        setAccount={setAccount}
        setProvider={setProvider}
        setContract={setContract}
      />
      
      <main className="min-h-screen bg-energy-light dark:bg-energy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Connect Wallet */}
            <Route
              path="/"
              element={
                // !account ? (
                  <ConnectWallet
                    setAccount={setAccount}
                    setProvider={setProvider}
                    setContract={setContract}
                  />
                // ) : (
                //   <Navigate to={userType ? `/dashboard/${userType}` : "/register"} />
                // )
              }
            />

            {/* Registration */}
            <Route
              path="/register"
              element={
                account && !userType ? (
                  <Register
                    setUserType={setUserType}
                    contract={contract}
                    account={account}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Producer Dashboard */}
            <Route
              path="/dashboard/producer"
              element={
                account && userType === 'producer' ? (
                  <ProducerDashboard
                    contract={contract}
                    account={account}
                    provider={provider}
                    refreshTrigger={refreshTrigger}
                    setRefreshTrigger={setRefreshTrigger}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Consumer Dashboard */}
            <Route
              path="/dashboard/consumer"
              element={
                account && userType === 'consumer' ? (
                  <ConsumerDashboard
                    contract={contract}
                    account={account}
                    provider={provider}
                    refreshTrigger={refreshTrigger}
                    setRefreshTrigger={setRefreshTrigger}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Market Place */}
            <Route
              path="/market"
              element={
                account && userType ? (
                  <MarketPlace
                    contract={contract}
                    account={account}
                    provider={provider}
                    userType={userType}
                    refreshTrigger={refreshTrigger}
                    setRefreshTrigger={setRefreshTrigger}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Energy Records */}
            <Route
              path="/records"
              element={
                account ? (
                  <EnergyRecords
                    contract={contract}
                    account={account}
                    provider={provider}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </ThemeProvider>
  );
}
export default App;