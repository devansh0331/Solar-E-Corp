import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { LightningIcon, BoltIcon, WalletIcon, CheckIcon, XIcon, ClockIcon, ZapIcon } from '../Icons';
import { ethers } from 'ethers';

export default function ConsumerDashboard({ contract, account, provider }) {
  const { darkMode } = useTheme();
  const [balance, setBalance] = useState('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [energyUsed, setEnergyUsed] = useState('0');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSupplies, setActiveSupplies] = useState([]);
  const [availableProducers, setAvailableProducers] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState({
    balance: false,
    deposit: false,
    requests: false,
    producers: false,
    history: false
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedProducer, setSelectedProducer] = useState('');

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds/60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds/3600)} hours`;
    return `${Math.floor(seconds/86400)} days`;
  };

  const fetchConsumerData = async () => {
    try {
      setLoading(prev => ({...prev, balance: true, requests: true, producers: true, history: true}));
      
      if (contract) {
        // Get consumer balance
        const consumerBalance = await contract.getConsumerBalance(account);
        setBalance(ethers.utils.formatEther(consumerBalance));

        // Get all producers and their status
        const [producerAddresses, producerRates, activeStatuses] = await contract.getAllProducers();
        
        // Format available producers
        const available = producerAddresses.map((address, i) => ({
          address,
          rate: ethers.utils.formatEther(producerRates[i]),
          supplyActive: activeStatuses[i]
        }));
        setAvailableProducers(available.filter(p => p.supplyActive && parseFloat(p.rate) > 0));

        // Get all requests involving this consumer
        const tempPendingRequests = [];
        const tempActiveSupplies = [];
        let totalEnergyUsed = 0;

        for (const producer of producerAddresses) {
  const request = await contract.requests(producer);
  console.log('Request for producer', producer, ':', request); // Add this for debugging
  
  if (request.consumer.toLowerCase() === account.toLowerCase() && request.active) {
    const producerData = available.find(p => p.address === producer);
    
    const requestData = {
      producer,
      producerRate: producerData?.rate || '0',
      requestedRate: ethers.utils.formatEther(request.rate),
      requestTime: new Date(request.requestTime * 1000),
      acceptTime: request.acceptTime > 0 ? new Date(request.acceptTime * 1000) : null,
      requestedAmount: ethers.utils.formatUnits(request.requestedAmount, 0),
      active: request.active
    };

    if (request.acceptTime > 0) {
      const energyDelivered = ethers.utils.formatUnits(request.requestedAmount, 0);
  const estimatedCost = ethers.utils.formatEther(
    ethers.BigNumber.from(request.requestedAmount).mul(request.rate)
  );
  
  tempActiveSupplies.push({
    ...requestData,
    energyDelivered,
    estimatedCost,
    startTime: new Date(request.acceptTime * 1000).toLocaleString()
  });
    } else {
      tempPendingRequests.push(requestData);
    }
  }
}

        setPendingRequests(tempPendingRequests);
        setActiveSupplies(tempActiveSupplies);

        // Get transaction history
        const txCount = await contract.getTransactionCount();
        const txHistory = [];
        
        for (let i = 0; i < txCount; i++) {
          const tx = await contract.getTransaction(i);
          if (tx.consumer.toLowerCase() === account.toLowerCase()) {
            txHistory.push({
              producer: tx.producer,
              amount: ethers.utils.formatEther(tx.amount),
              // rate: ethers.utils.formatEther(tx.amount / tx.duration), // Approximate rate
              startTime: new Date((tx.timestamp - tx.duration) * 1000).toLocaleString(),
              endTime: new Date(tx.timestamp * 1000).toLocaleString(),
              duration: formatDuration(tx.duration)
            });
          }
        }

        setTransactionHistory(txHistory.reverse()); // Show newest first
      }
    } catch (err) {
      console.error("Error fetching consumer data:", err);
      setError("Failed to load consumer data");
    } finally {
      setLoading(prev => ({...prev, balance: false, requests: false, producers: false, history: false}));
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount)) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(prev => ({...prev, deposit: true}));
    setError('');
    setSuccessMessage('');

    try {
      const tx = await contract.deposit({
        value: ethers.utils.parseEther(depositAmount)
      });
      await tx.wait();
      setSuccessMessage(`Deposited ${depositAmount} ETH successfully`);
      setDepositAmount('');
      fetchConsumerData();
    } catch (err) {
      console.error("Error depositing funds:", err);
      setError(err.message || "Failed to deposit funds");
    } finally {
      setLoading(prev => ({...prev, deposit: false}));
    }
  };

  const handleRequestEnergy = async () => {
    if (!selectedProducer) {
      setError("Please select a producer");
      return;
    }

    setLoading(prev => ({...prev, requests: true}));
    setError('');
    setSuccessMessage('');

    try {
      const tx = await contract.requestEnergy(selectedProducer);
      await tx.wait();
      setSuccessMessage(`Energy request sent to producer ${selectedProducer.slice(0, 6)}...`);
      setSelectedProducer('');
      fetchConsumerData();
    } catch (err) {
      console.error("Error requesting energy:", err);
      setError(err.message || "Failed to request energy");
    } finally {
      setLoading(prev => ({...prev, requests: false}));
    }
  };

  const handleTerminateRequest = async (producer) => {
    setLoading(prev => ({...prev, requests: true}));
    setError('');
    setSuccessMessage('');

    try {
      const tx = await contract.terminateRequest(producer);
      await tx.wait();
      setSuccessMessage(`Request with ${producer.slice(0, 6)}... terminated`);
      fetchConsumerData();
    } catch (err) {
      console.error("Error terminating request:", err);
      setError(err.message || "Failed to terminate request");
    } finally {
      setLoading(prev => ({...prev, requests: false}));
    }
  };

  useEffect(() => {
    if (contract && account) {
      fetchConsumerData();
    }
  }, [contract, account]);
  useEffect(() => {
  console.log('Pending requests updated:', pendingRequests);
}, [pendingRequests]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className={`text-3xl font-bold flex items-center ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
          <LightningIcon className={`w-8 h-8 mr-2 ${darkMode ? 'text-energy-secondary' : 'text-energy-primary'}`} />
          Consumer Dashboard
        </h2>
        <p className={`mt-2 ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
          Manage your energy consumption and payments
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Balance */}
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-energy-dark/50' : 'bg-energy-light'}`}>
              <WalletIcon className={`w-6 h-6 ${darkMode ? 'text-energy-secondary' : 'text-energy-primary'}`} />
            </div>
            <div>
              <h3 className={`text-sm ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>Current Balance</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
                {loading.balance ? 'Loading...' : `${balance} ETH`}
              </p>
            </div>
          </div>
        </div>

        {/* Energy Used */}
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-energy-dark/50' : 'bg-energy-light'}`}>
              <BoltIcon className={`w-6 h-6 ${darkMode ? 'text-solar-yellow' : 'text-energy-accent'}`} />
            </div>
            <div>
              <h3 className={`text-sm ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>Energy Used</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
                {loading.requests ? 'Loading...' : `${energyUsed} kWh`}
              </p>
            </div>
          </div>
        </div>

        {/* Deposit Section */}
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
          <h3 className={`text-sm mb-2 ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>Deposit Funds</h3>
          <div className="flex items-center">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-lg border mr-2 ${
                darkMode
                  ? 'bg-energy-dark border-energy-secondary/30 text-dark-text'
                  : 'bg-white border-gray-300 text-energy-text'
              }`}
              placeholder="ETH amount"
              disabled={loading.deposit}
            />
            <button
              onClick={handleDeposit}
              disabled={loading.deposit}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-energy-secondary hover:bg-energy-secondary/90 text-white'
                  : 'bg-energy-primary hover:bg-energy-primary/90 text-white'
              } ${loading.deposit ? 'opacity-70' : ''}`}
            >
              {loading.deposit ? 'Depositing...' : 'Deposit'}
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-power-red/20 text-power-red' : 'bg-power-red/10 text-power-red'}`}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-grid-green/20 text-grid-green' : 'bg-grid-green/10 text-grid-green'}`}>
          {successMessage}
        </div>
      )}

      {/* Request Energy Section */}
      {/* <div className={`rounded-xl p-6 mb-8 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
          Request Energy
        </h3>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className={`block mb-2 ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
              Select Producer
            </label>
            <select
              value={selectedProducer}
              onChange={(e) => setSelectedProducer(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-energy-dark border-energy-secondary/30 text-dark-text'
                  : 'bg-white border-gray-300 text-energy-text'
              }`}
              disabled={loading.producers}
            >
              <option value="">Select a producer</option>
              {availableProducers.map((producer, index) => (
                <option key={index} value={producer.address}>
                  {producer.address.slice(0, 6)}... - Rate: {producer.rate} ETH/kWh
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRequestEnergy}
            disabled={loading.requests || !selectedProducer}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode
                ? 'bg-energy-secondary hover:bg-energy-secondary/90 text-white'
                : 'bg-energy-primary hover:bg-energy-primary/90 text-white'
            } ${loading.requests ? 'opacity-70' : ''}`}
          >
            {loading.requests ? 'Requesting...' : 'Request Energy'}
          </button>
        </div>
      </div> */}

      {/* Pending Requests Section */}
         <div className={`rounded-xl overflow-hidden mb-8 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-energy-secondary/20">
          <div className="flex items-center">
            <ClockIcon className={`w-6 h-6 mr-2 ${darkMode ? 'text-solar-yellow' : 'text-energy-accent'}`} />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
              Pending Energy Requests ({pendingRequests.length})
            </h3>
          </div>
          <p className={`mt-1 text-sm ${darkMode ? 'text-energy-secondary' : 'text-gray-500'}`}>
            Requests waiting for producer acceptance
          </p>
        </div>

        {loading.requests ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-energy-primary"></div>
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-energy-dark/50' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Producer</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Producer Rate</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Your Requested Rate</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Request Date</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request, index) => (
                  <tr
                    key={index}
                    className={`border-b ${darkMode ? 'border-energy-secondary/10' : 'border-gray-200'}`}
                  >
                    <td className="p-4">
                      <span className={`font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
                        {request.producer.slice(0, 6)}...{request.producer.slice(-4)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {request.producerRate} ETH/kWh
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${darkMode ? 'text-energy-secondary' : 'text-energy-primary'}`}>
                        {request.requestedRate} ETH/kWh
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {request.requestTime.toLocaleDateString()}
                        <br />
                        <span className="text-xs opacity-75">
                          {request.requestTime.toLocaleTimeString()}
                        </span>
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleTerminateRequest(request.producer)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          darkMode
                            ? 'bg-power-red/20 text-power-red hover:bg-power-red/30'
                            : 'bg-power-red/10 text-power-red hover:bg-power-red/20'
                        }`}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`p-8 text-center ${darkMode ? 'text-dark-text' : 'text-gray-500'}`}>
            No pending energy requests found
          </div>
        )}
      </div>


      {/* Active Energy Supplies Section */}
      <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-energy-secondary/20">
          <div className="flex items-center">
            <ZapIcon className={`w-6 h-6 mr-2 ${darkMode ? 'text-solar-yellow' : 'text-energy-accent'}`} />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
              Active Energy Supplies
            </h3>
          </div>
          <p className={`mt-1 text-sm ${darkMode ? 'text-energy-secondary' : 'text-gray-500'}`}>
            Currently receiving energy from these producers
          </p>
        </div>

        {loading.requests ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-energy-primary"></div>
          </div>
        ) : activeSupplies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
             <thead className={`${darkMode ? 'bg-energy-dark/50' : 'bg-gray-50'}`}>
  <tr>
    <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Producer</th>
    <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Rate</th>
    <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Energy (kWh)</th>
    <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Cost (ETH)</th>
    <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Started</th>
  </tr>
</thead>
<tbody>
  {activeSupplies.map((supply, index) => (
    <tr key={index} className={`border-b ${darkMode ? 'border-energy-secondary/10' : 'border-gray-200'}`}>
      <td className={`p-4 font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
        {supply.producer.slice(0, 6)}...{supply.producer.slice(-4)}
      </td>
       <td className={`p-4 font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
        {supply.requestedRate} ETH/kWh
      </td>
       <td className={`p-4 font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
        {supply.energyDelivered}
      </td>
       <td className={`p-4 font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
        {supply.estimatedCost}
      </td>
       <td className={`p-4 font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
        {supply.startTime}
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        ) : (
          <div className={`p-8 text-center ${darkMode ? 'text-dark-text' : 'text-gray-500'}`}>
            No active energy supplies
          </div>
        )}
      </div>
       {/* Transaction History Section */}
      <div className={`rounded-xl overflow-hidden mt-8 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-energy-secondary/20">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
            Transaction History
          </h3>
        </div>

        {loading.history ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-energy-primary"></div>
          </div>
        ) : transactionHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-energy-dark/50' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Producer</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Amount (ETH)</th>
                  {/* <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Rate</th> */}
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Start Time</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>End Time</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map((transaction, index) => (
                  <tr
                    key={index}
                    className={`border-b ${darkMode ? 'border-energy-secondary/10' : 'border-gray-200'}`}
                  >
                    <td className="p-4">
                      <span className={`font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
                        {transaction.producer.slice(0, 6)}...{transaction.producer.slice(-4)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {transaction.amount}
                      </span>
                    </td>
                    {/* <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {transaction.rate} ETH/kWh
                      </span>
                    </td> */}
                    <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {transaction.startTime}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {transaction.endTime}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <ClockIcon className={`w-4 h-4 mr-1 ${darkMode ? 'text-dark-text' : 'text-gray-600'}`} />
                        <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                          {transaction.duration}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`p-8 text-center ${darkMode ? 'text-dark-text' : 'text-gray-500'}`}>
            No transaction history available
          </div>
        )}
      </div>
    </div>
  );
}