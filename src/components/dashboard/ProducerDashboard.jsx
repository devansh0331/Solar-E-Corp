import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { SolarPanelIcon, BoltIcon, WalletIcon, PowerIcon, ClockIcon, WithdrawIcon } from '../Icons';
import { ethers } from 'ethers';

export default function ProducerDashboard({ contract, account, provider }) {
  const { darkMode } = useTheme();
  const [energyRate, setEnergyRate] = useState('');
  const [currentRate, setCurrentRate] = useState('0');
  const [totalRevenue, setTotalRevenue] = useState('0');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState({
    rate: false,
    requests: false,
    settlement: false,
    balance: false,
    supplyStatus: false,
    history: false,
    withdraw: false
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [currentMeterReading, setCurrentMeterReading] = useState('');
  const [supplyActive, setSupplyActive] = useState(false);

  // Helper function to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds/60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds/3600)} hours`;
    return `${Math.floor(seconds/86400)} days`;
  };

  // Fetch producer data
  const fetchProducerData = async () => {
    try {
      setLoading(prev => ({...prev, requests: true, balance: true, supplyStatus: true, history: true}));
      
      if (contract) {
        // Get current rate and supply status
        const producerData = await contract.producers(account);
        setCurrentRate(ethers.utils.formatEther(producerData.rate));
        setEnergyRate(ethers.utils.formatEther(producerData.rate));
        setSupplyActive(producerData.supplyActive);

        // Get producer balance (total revenue)
        const producerBalance = await contract.getProducerBalance(account);
        setTotalRevenue(ethers.utils.formatEther(producerBalance));

        // Get active request for this producer
        const activeRequests = [];
        const request = await contract.requests(account);
        
        if (request.active && request.consumer !== ethers.constants.AddressZero) {
          const consumerBalance = await contract.getConsumerBalance(request.consumer);
          
          activeRequests.push({
            consumer: request.consumer,
            rate: ethers.utils.formatEther(request.rate),
            requestTime: request.requestTime > 0 ? new Date(request.requestTime * 1000).toLocaleString() : 'Not Accepted',
            acceptTime: request.acceptTime > 0 ? new Date(request.acceptTime * 1000).toLocaleString() : 'Not Accepted',
            requestedAmount: ethers.utils.formatUnits(request.requestedAmount, 0),
            active: request.active,
            consumerBalance: ethers.utils.formatEther(consumerBalance),
            accepted: request.acceptTime > 0
          });
        }

        setRequests(activeRequests);

        // Get transaction history
       // Get transaction history
        const txCount = await contract.getTransactionCount();
        const txHistory = [];

        for (let i = 0; i < txCount; i++) {
          const tx = await contract.getTransaction(i);
          if (tx.producer.toLowerCase() === account.toLowerCase()) {
              // Calculate rate safely by first converting to BigNumber
              const amountBN = ethers.BigNumber.from(tx.amount);
              const durationBN = ethers.BigNumber.from(tx.duration);
    
              // Only calculate rate if duration is not zero to avoid division by zero
              let rate = "0";
              if (!durationBN.isZero()) {
                // Multiply by 1e18 to maintain precision before division
                const rateBN = amountBN.mul(ethers.BigNumber.from(10).pow(18)).div(durationBN);
                rate = ethers.utils.formatEther(rateBN);
              }

              txHistory.push({
              consumer: tx.consumer,
              amount: ethers.utils.formatEther(tx.amount),
              // rate: rate,
              startTime: new Date((tx.timestamp - tx.duration) * 1000).toLocaleString(),
              endTime: new Date(tx.timestamp * 1000).toLocaleString(),
              duration: formatDuration(tx.duration)
          });
  }
}

        setHistory(txHistory.reverse()); // Show newest first
      }
    } catch (err) {
      console.error("Error fetching producer data:", err);
      setError("Failed to load producer data");
    } finally {
      setLoading(prev => ({...prev, requests: false, balance: false, supplyStatus: false, history: false}));
    }
  };

  const toggleSupplyStatus = async () => {
    setLoading(prev => ({...prev, supplyStatus: true}));
    setError('');
    setSuccessMessage('');

    try {
      let tx;
      if (supplyActive) {
        tx = await contract.deactivateSupply();
      } else {
        tx = await contract.activateSupply();
      }
      await tx.wait();
      setSupplyActive(!supplyActive);
      setSuccessMessage(`Supply ${supplyActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error("Error toggling supply status:", err);
      setError(err.message || "Failed to update supply status");
    } finally {
      setLoading(prev => ({...prev, supplyStatus: false}));
    }
  };

  const handleSetRate = async () => {
    if (!energyRate || isNaN(energyRate)) {
      setError("Please enter a valid rate");
      return;
    }

    setLoading(prev => ({...prev, rate: true}));
    setError('');
    setSuccessMessage('');

    try {
      const rateWei = ethers.utils.parseEther(energyRate);
      const tx = await contract.setRate(rateWei);
      await tx.wait();
      setSuccessMessage(`Energy rate set to ${energyRate} ETH/kWh`);
      setCurrentRate(energyRate);
    } catch (err) {
      console.error("Error setting energy rate:", err);
      setError(err.message || "Failed to set energy rate");
    } finally {
      setLoading(prev => ({...prev, rate: false}));
    }
  };

  const handleAcceptRequest = async (consumerAddress) => {
    setLoading(prev => ({...prev, requests: true}));
    setError('');
    setSuccessMessage('');

    try {
      const tx = await contract.acceptRequest(consumerAddress);
      await tx.wait();
      setSuccessMessage(`Request accepted! Started supply to ${consumerAddress.slice(0, 6)}...`);
      fetchProducerData();
    } catch (err) {
      console.error("Error accepting request:", err);
      setError(err.message || "Failed to accept request");
    } finally {
      setLoading(prev => ({...prev, requests: false}));
    }
  };

  const handleSettlePayment = async (producerAddress, deliveredAmount) => {
    if (!deliveredAmount || isNaN(deliveredAmount)) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(prev => ({...prev, settlement: true}));
    setError('');
    setSuccessMessage('');

    try {
      const tx = await contract.settlePayment(
        producerAddress,
        ethers.utils.parseUnits(deliveredAmount, 0)
      );
      await tx.wait();
      setSuccessMessage(`Payment settled successfully`);
      fetchProducerData();
    } catch (err) {
      console.error("Error settling payment:", err);
      setError(err.message || "Failed to settle payment");
    } finally {
      setLoading(prev => ({...prev, settlement: false}));
    }
  };

  const handleTerminateRequest = async () => {
    setLoading(prev => ({...prev, requests: true}));
    setError('');
    setSuccessMessage('');

    try {
      const tx = await contract.terminateRequest(account);
      await tx.wait();
      setSuccessMessage(`Request terminated successfully`);
      fetchProducerData();
    } catch (err) {
      console.error("Error terminating request:", err);
      setError(err.message || "Failed to terminate request");
    } finally {
      setLoading(prev => ({...prev, requests: false}));
    }
  };

  const handleWithdraw = async () => {
  if (!withdrawAmount || isNaN(withdrawAmount)) {
    setError("Please enter a valid amount");
    return;
  }

  setLoading(prev => ({...prev, withdraw: true}));
  setError('');
  setSuccessMessage('');

  try {
    // No need to parse the amount since the contract withdraws the full balance
    const tx = await contract.withdrawProducerBalance();
    await tx.wait();
    setSuccessMessage(`Successfully withdrew your full balance`);
    setWithdrawAmount('');
    fetchProducerData();
  } catch (err) {
    console.error("Error withdrawing funds:", err);
    setError(err.message || "Failed to withdraw funds");
  } finally {
    setLoading(prev => ({...prev, withdraw: false}));
  }
};
  useEffect(() => {
    if (contract && account) {
      fetchProducerData();
    }
  }, [contract, account]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className={`text-3xl font-bold flex items-center ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
          <SolarPanelIcon className={`w-8 h-8 mr-2 ${darkMode ? 'text-solar-yellow' : 'text-energy-primary'}`} />
          Producer Dashboard
        </h2>
        <p className={`mt-2 ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
          Manage your energy production and consumer requests
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Revenue */}
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-energy-dark/50' : 'bg-energy-light'}`}>
              <WalletIcon className={`w-6 h-6 ${darkMode ? 'text-energy-secondary' : 'text-energy-primary'}`} />
            </div>
            <div>
              <h3 className={`text-sm ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>Total Revenue</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
                {loading.balance ? 'Loading...' : `${totalRevenue} ETH`}
              </p>
            </div>
          </div>
        </div>

        {/* Current Rate */}
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-energy-dark/50' : 'bg-energy-light'}`}>
              <BoltIcon className={`w-6 h-6 ${darkMode ? 'text-solar-yellow' : 'text-energy-accent'}`} />
            </div>
            <div>
              <h3 className={`text-sm ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>Current Rate</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
                {loading.rate ? 'Loading...' : `${currentRate} ETH/kWh`}
              </p>
            </div>
          </div>
        </div>

        {/* Supply Status */}
        <div className={`rounded-xl p-6 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-energy-dark/50' : 'bg-energy-light'}`}>
              <PowerIcon className={`w-6 h-6 ${supplyActive ? (darkMode ? 'text-grid-green' : 'text-grid-green') : (darkMode ? 'text-power-red' : 'text-power-red')}`} />
            </div>
            <div>
              <h3 className={`text-sm ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>Supply Status</h3>
              <div className="flex items-center">
                <p className={`text-2xl font-bold mr-3 ${supplyActive ? (darkMode ? 'text-grid-green' : 'text-grid-green') : (darkMode ? 'text-power-red' : 'text-power-red')}`}>
                  {loading.supplyStatus ? 'Loading...' : supplyActive ? 'Active' : 'Inactive'}
                </p>
                <button
                  onClick={toggleSupplyStatus}
                  disabled={loading.supplyStatus}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    supplyActive
                      ? darkMode
                        ? 'bg-power-red/20 text-power-red hover:bg-power-red/30'
                        : 'bg-power-red/10 text-power-red hover:bg-power-red/20'
                      : darkMode
                        ? 'bg-grid-green/20 text-grid-green hover:bg-grid-green/30'
                        : 'bg-grid-green/10 text-grid-green hover:bg-grid-green/20'
                  }`}
                >
                  {loading.supplyStatus ? '...' : supplyActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
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

      {/* Set Energy Rate Section */}
      <div className={`rounded-xl p-6 mb-8 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
          Update Energy Rate
        </h3>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className={`block mb-2 ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
              New Rate (ETH/kWh)
            </label>
            <input
              type="number"
              value={energyRate}
              onChange={(e) => setEnergyRate(e.target.value)}
              step="0.00001"
              min="0"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-energy-dark border-energy-secondary/30 text-dark-text'
                  : 'bg-white border-gray-300 text-energy-text'
              }`}
              placeholder="Enter rate in ETH"
            />
          </div>
          <button
            onClick={handleSetRate}
            disabled={loading.rate}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode
                ? 'bg-energy-secondary hover:bg-energy-secondary/90 text-white'
                : 'bg-energy-primary hover:bg-energy-primary/90 text-white'
            } ${loading.rate ? 'opacity-70' : ''}`}
          >
            {loading.rate ? 'Updating...' : 'Update Rate'}
          </button>
        </div>
      </div>

      {/* Withdraw Funds Section */}
      <div className={`rounded-xl p-6 mb-8 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
          Withdraw Funds
        </h3>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className={`block mb-2 ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
              Amount to Withdraw (ETH)
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              step="0.00001"
              min="0"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-energy-dark border-energy-secondary/30 text-dark-text'
                  : 'bg-white border-gray-300 text-energy-text'
              }`}
              placeholder="Enter amount to withdraw"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={loading.withdraw}
            className={`px-6 py-2 rounded-lg font-medium flex items-center justify-center ${
              darkMode
                ? 'bg-energy-secondary hover:bg-energy-secondary/90 text-white'
                : 'bg-energy-primary hover:bg-energy-primary/90 text-white'
            } ${loading.withdraw ? 'opacity-70' : ''}`}
          >
            <WithdrawIcon className="w-5 h-5 mr-2" />
            {loading.withdraw ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      </div>

      {/* Active Requests Section */}
      <div className={`rounded-xl overflow-hidden mb-8 ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-energy-secondary/20">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
            Active Energy Requests
          </h3>
        </div>

        {loading.requests ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-energy-primary"></div>
          </div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-energy-dark/50' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Consumer</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Rate</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Balance</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Requested</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Status</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                  <tr
                    key={index}
                    className={`border-b ${darkMode ? 'border-energy-secondary/10' : 'border-gray-200'}`}
                  >
                    <td className="p-4">
                      <span className={`font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
                        {request.consumer.slice(0, 6)}...{request.consumer.slice(-4)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {request.rate} ETH/kWh
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={darkMode ? 'text-energy-secondary' : 'text-energy-primary'}>
                        {request.consumerBalance} ETH
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {request.requestedAmount} kWh
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={darkMode ? 'text-dark-text' : 'text-gray-800'}>
                        {request.accepted ? `Accepted at ${request.acceptTime}` : 'Not Accepted'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-2">
                        {!request.accepted ? (
                          <button
                            onClick={() => handleAcceptRequest(request.consumer)}
                            disabled={loading.requests}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              darkMode
                                ? 'bg-energy-secondary hover:bg-energy-secondary/90 text-white'
                                : 'bg-energy-primary hover:bg-energy-primary/90 text-white'
                            } ${loading.requests ? 'opacity-70' : ''}`}
                          >
                            {loading.requests ? 'Processing...' : 'Accept Request'}
                          </button>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={currentMeterReading}
                                onChange={(e) => setCurrentMeterReading(e.target.value)}
                                className={`flex-1 px-3 py-1 rounded-lg border mr-2 ${
                                  darkMode
                                    ? 'bg-energy-dark border-energy-secondary/30 text-dark-text'
                                    : 'bg-white border-gray-300 text-energy-text'
                                }`}
                                placeholder="Current reading (kWh)"
                              />
                              <button
                                onClick={() => handleSettlePayment(account, currentMeterReading)}
                                disabled={loading.settlement || !currentMeterReading}
                                className={`px-3 py-1 rounded-lg text-sm ${
                                  darkMode
                                    ? 'bg-energy-secondary hover:bg-energy-secondary/90 text-white'
                                    : 'bg-energy-primary hover:bg-energy-primary/90 text-white'
                                } ${loading.settlement ? 'opacity-70' : ''}`}
                              >
                                {loading.settlement ? 'Processing...' : 'Settle Payment'}
                              </button>
                            </div>
                            <button
                              onClick={handleTerminateRequest}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                darkMode
                                  ? 'bg-power-red/20 text-power-red hover:bg-power-red/30'
                                  : 'bg-power-red/10 text-power-red hover:bg-power-red/20'
                              }`}
                            >
                              Terminate Request
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`p-8 text-center ${darkMode ? 'text-dark-text' : 'text-gray-500'}`}>
            No active energy requests
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-energy-dark/80 border border-energy-secondary/20' : 'bg-white border border-gray-200'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-energy-secondary/20">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-dark-text' : 'text-energy-text'}`}>
            Transaction History
          </h3>
        </div>

        {loading.history ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-energy-primary"></div>
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-energy-dark/50' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Consumer</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Amount (ETH)</th>
                  {/* <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Rate</th> */}
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Start Time</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>End Time</th>
                  <th className={`p-4 text-left ${darkMode ? 'text-dark-text' : 'text-gray-700'}`}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {history.map((transaction, index) => (
                  <tr
                    key={index}
                    className={`border-b ${darkMode ? 'border-energy-secondary/10' : 'border-gray-200'}`}
                  >
                    <td className="p-4">
                      <span className={`font-mono ${darkMode ? 'text-dark-text' : 'text-gray-600'}`}>
                        {transaction.consumer.slice(0, 6)}...{transaction.consumer.slice(-4)}
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