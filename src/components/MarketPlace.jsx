import { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeContext";
import { LightningIcon, SolarPanelIcon, BoltIcon, ChevronRightIcon } from "../components/Icons";
import { ethers } from "ethers";

export default function MarketPlace({ contract, account, userType }) {
  const { darkMode } = useTheme();
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducer, setSelectedProducer] = useState(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [consumerBalance, setConsumerBalance] = useState("0");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        if (contract && account) {
          // Get all producers and their details
          const [addresses, rates, activeStatuses] = await contract.getAllProducers();
          
          // Filter only active producers and format the data
          const activeProducers = [];
          for (let i = 0; i < addresses.length; i++) {
            if (activeStatuses[i]) { // Only include if supply is active
              activeProducers.push({
                address: addresses[i],
                rate: ethers.utils.formatEther(rates[i]),
                rateWei: rates[i].toString(),
                active: activeStatuses[i]
              });
            }
          }
          
          setProducers(activeProducers);

          // Get consumer balance if registered
          
            const balance = await contract.getConsumerBalance(account);
            setConsumerBalance(ethers.utils.formatEther(balance));
          
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load marketplace data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contract, account, userType]);

  const handleRequestEnergy = async () => {
    if (!selectedProducer || !requestAmount || isNaN(requestAmount) || parseFloat(requestAmount) <= 0) {
      setError("Please enter a valid amount (greater than 0)");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Convert kWh amount to basic units (no decimals)
      const kwhAmount = ethers.BigNumber.from(
        Math.floor(parseFloat(requestAmount))
      );

      // Calculate required payment (rateWei * kWh)
      const requiredPayment = ethers.BigNumber.from(selectedProducer.rateWei)
        .mul(kwhAmount);

      // Get current balance
      const balance = await contract.getConsumerBalance(account);
      
      // Debug logs
      console.log("Request Amount (kWh):", requestAmount);
      console.log("kWh Amount (units):", kwhAmount.toString());
      console.log("Rate (wei):", selectedProducer.rateWei);
      console.log("Required Payment (wei):", requiredPayment.toString());
      console.log("Balance (wei):", balance.toString());

      // Check if consumer has enough balance
      if (balance.lt(requiredPayment)) {
        throw new Error(
          `Insufficient balance. You need ${ethers.utils.formatEther(requiredPayment)} ETH but only have ${ethers.utils.formatEther(balance)} ETH`
        );
      }

      // Call the contract's requestEnergy function
      const tx = await contract.requestEnergy(
        selectedProducer.address,
        kwhAmount // Send kWh amount in basic units
      );
      
      await tx.wait();

      setSuccessMessage(`Energy request for ${requestAmount} kWh sent successfully!`);
      setSelectedProducer(null);
      setRequestAmount("");
    } catch (err) {
      console.error("Error requesting energy:", err);
      setError(err.reason || err.message || "Failed to request energy");
    } finally {
      setLoading(false);
    }
  };

  if (userType === "producer") {
    return (
      <div className={`p-6 rounded-lg ${darkMode ? "bg-energy-dark/50" : "bg-energy-light"} text-center`}>
        <h3 className={`text-xl font-medium ${darkMode ? "text-dark-text" : "text-energy-text"}`}>
          <SolarPanelIcon className={`inline-block w-6 h-6 mr-2 ${darkMode ? "text-solar-yellow" : "text-energy-primary"}`} />
          Producer Dashboard
        </h3>
        <p className={`mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          As a producer, you can manage your energy supply in your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className={`text-3xl font-bold ${darkMode ? "text-dark-text" : "text-energy-text"}`}>
          <LightningIcon className={`inline-block w-8 h-8 mr-2 ${darkMode ? "text-energy-secondary" : "text-energy-primary"}`} />
          Energy Marketplace
        </h2>
        <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Browse available energy producers with active supply
        </p>
        {userType === "consumer" && (
          <div className={`mt-4 p-3 rounded-lg ${darkMode ? "bg-energy-dark/70" : "bg-gray-100"}`}>
            <p className={darkMode ? "text-dark-text" : "text-gray-700"}>
              Your balance: <span className="font-semibold">{consumerBalance} ETH</span>
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-power-red/20 text-power-red" : "bg-power-red/10 text-power-red"}`}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-grid-green/20 text-grid-green" : "bg-grid-green/10 text-grid-green"}`}>
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-energy-primary"></div>
        </div>
      ) : producers.length === 0 ? (
        <div className={`p-8 text-center rounded-xl ${darkMode ? "bg-energy-dark/50" : "bg-gray-100"}`}>
          <p className={darkMode ? "text-dark-text" : "text-gray-600"}>
            No active energy producers available at this time.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {producers.map((producer, index) => (
              <div
                key={index}
                className={`rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl ${
                  darkMode ? "bg-energy-dark border border-energy-secondary/20" : "bg-white border border-gray-200"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <SolarPanelIcon className={`w-8 h-8 mr-3 ${darkMode ? "text-solar-yellow" : "text-energy-primary"}`} />
                    <h3 className={`text-lg font-semibold ${darkMode ? "text-dark-text" : "text-energy-text"}`}>
                      Energy Producer
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={darkMode ? "text-dark-text" : "text-gray-600"}>Rate</span>
                      <span className={`font-medium ${darkMode ? "text-energy-secondary" : "text-energy-primary"}`}>
                        {producer.rate} ETH/kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? "text-dark-text" : "text-gray-600"}>Status</span>
                      <span className={`font-medium ${darkMode ? "text-grid-green" : "text-grid-green"}`}>
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={darkMode ? "text-dark-text" : "text-gray-600"}>Address</span>
                      <span className="text-gray-400 truncate max-w-[120px]">
                        {producer.address.slice(0, 6)}...{producer.address.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? "text-dark-text" : "text-gray-600"}>Estimated Cost</span>
                      <span className={`font-medium ${darkMode ? "text-energy-secondary" : "text-energy-primary"}`}>
                        {(parseFloat(producer.rate) * 1).toFixed(6)} ETH for 1 kWh
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`px-6 py-4 ${
                  darkMode ? "bg-energy-dark/70 border-t border-energy-secondary/10" : "bg-gray-50 border-t border-gray-100"
                }`}>
                  <button
                    onClick={() => setSelectedProducer(producer)}
                    className={`w-full py-2 px-4 rounded-lg flex items-center justify-center ${
                      darkMode
                        ? "bg-energy-secondary hover:bg-energy-secondary/90 text-white"
                        : "bg-energy-primary hover:bg-energy-primary/90 text-white"
                    }`}
                  >
                    Request Energy <ChevronRightIcon className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Request Energy Modal */}
          {selectedProducer && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className={`rounded-xl w-full max-w-md p-6 ${
                darkMode ? "bg-energy-dark border border-energy-secondary/30" : "bg-white border border-gray-200"
              }`}>
                <h3 className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-dark-text" : "text-energy-text"
                }`}>
                  Request Energy
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block mb-2 ${darkMode ? "text-dark-text" : "text-gray-700"}`}>
                      Producer Address
                    </label>
                    <div className={`p-2 rounded-lg ${
                      darkMode ? "bg-energy-dark/50" : "bg-gray-100",
                      darkMode ? "text-energy-secondary" : "text-energy-primary"
                    }`}>
                      <p className="break-all ">{selectedProducer.address}</p>
                    </div>
                  </div>

                  <div>
                    <label className={`block mb-2 ${darkMode ? "text-dark-text" : "text-gray-700"}`}>
                      Rate
                    </label>
                    <div className={`p-2 rounded-lg ${
                      darkMode ? "bg-energy-dark/50" : "bg-gray-100",
                      darkMode ? "text-energy-secondary" : "text-energy-primary"
                    }`}>
                      <p>{selectedProducer.rate} ETH/kWh</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block mb-2 ${darkMode ? "text-dark-text" : "text-gray-700"}`}>
                      Request Energy (kWh)
                    </label>
                    <input
                      type="number"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode
                          ? "bg-energy-dark border-energy-secondary/30 text-dark-text"
                          : "bg-white border-gray-300 text-energy-text"
                      }`}
                      placeholder="Enter amount in kWh"
                      step="0.1"
                      min="0.1"
                    />
                  </div>

                  {requestAmount && !isNaN(requestAmount) && parseFloat(requestAmount) > 0 && (
                    <div className={`p-3 rounded-lg ${
                      darkMode ? "bg-energy-dark/70" : "bg-gray-100"
                    }`}>
                      <p className={darkMode ? "text-dark-text" : "text-gray-700"}>
                        Estimated cost: <span className="font-semibold">
                          {(parseFloat(selectedProducer.rate) * parseFloat(requestAmount)).toFixed(6)} ETH
                        </span>
                      </p>
                      <p className={`text-sm mt-1 ${darkMode ? "text-energy-secondary" : "text-energy-primary"}`}>
                        Your balance: {consumerBalance} ETH
                      </p>
                      {parseFloat(consumerBalance) < (parseFloat(selectedProducer.rate) * parseFloat(requestAmount)) && (
                        <p className={`text-sm mt-1 ${darkMode ? "text-power-red" : "text-power-red"}`}>
                          Warning: Your balance is insufficient for this request
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex space-x-4 pt-2">
                    <button
                      onClick={() => {
                        setSelectedProducer(null);
                        setRequestAmount("");
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        darkMode
                          ? "border-energy-secondary/30 text-dark-text hover:bg-energy-dark/80"
                          : "border-gray-300 text-energy-text hover:bg-gray-100"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestEnergy}
                      disabled={loading}
                      className={`flex-1 py-2 px-4 rounded-lg ${
                        darkMode
                          ? "bg-energy-secondary hover:bg-energy-secondary/90 text-white"
                          : "bg-energy-primary hover:bg-energy-primary/90 text-white"
                      } flex items-center justify-center`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        "Confirm Request"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}