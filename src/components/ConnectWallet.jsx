import { motion } from "framer-motion";
import { useTheme } from "./ThemeContext";
import { WalletIcon, ArrowRightIcon, LightningIcon, SolarPanelIcon, ShieldCheckIcon } from "./Icons";
import { ethers } from "ethers";

export default function ConnectWallet({ setAccount, setProvider, setContract }) {
  const { darkMode } = useTheme();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setAccount(accounts[0]);
        setProvider(provider);
        
        // Here you would initialize your contract instance
        // const contract = new ethers.Contract(...);
        // setContract(contract);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      window.open("https://metamask.io/download.html", "_blank");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center"
      >
        <div className="mb-12 ">
          <motion.h1
            className={`text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r ${
              darkMode
                ? "from-energy-secondary to-grid-green"
                : "from-energy-primary to-energy-accent"
            } bg-clip-text text-transparent`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Energy Trading Platform
          </motion.h1>
          <motion.p
            className={`text-xl mb-8 ${
              darkMode ? "text-dark-text" : "text-energy-text"
            } max-w-2xl mx-auto`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Connect your wallet to trade renewable energy directly with producers
          </motion.p>
        </div>

        {/* Animated Wallet Card */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className={`p-8 rounded-2xl shadow-xl border border-energy-secondary ${
            darkMode ? "bg-energy-dark" : "bg-white"
          } max-w-md mx-auto mb-12`}
        >
          <div className="flex flex-col items-center">
            <div
              className={`p-4 rounded-full ${
                darkMode ? "bg-dark" : "bg-energy-light"
              } mb-6`}
            >
              <WalletIcon
                className={`w-10 h-10 ${
                  darkMode ? "text-dark-primary" : "text-energy-primary"
                }`}
              />
            </div>
            <motion.button
              onClick={connectWallet}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`px-8 py-4 text-lg font-semibold rounded-full flex items-center space-x-2 ${
                darkMode
                  ? "bg-gradient-to-r from-dark-primary to-dark-accent hover:from-energy-secondary hover:to-grid-green"
                  : "bg-gradient-to-r from-energy-primary to-energy-accent hover:from-energy-secondary hover:to-grid-green"
              } text-white shadow-lg`}
            >
              <span>Connect Wallet</span>
              <ArrowRightIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: (
                <LightningIcon
                  className={`w-8 h-8 ${
                    darkMode ? "text-solar-yellow" : "text-power-red"
                  }`}
                />
              ),
              title: "Direct Trading",
              description: "Buy energy directly from producers at competitive rates",
            },
            {
              icon: (
                <ShieldCheckIcon
                  className={`w-8 h-8 ${
                    darkMode ? "text-dark-accent" : "text-energy-accent"
                  }`}
                />
              ),
              title: "Secure Payments",
              description: "Automated smart contract settlements ensure fair transactions",
            },
            {
              icon: (
                <SolarPanelIcon
                  className={`w-8 h-8 ${
                    darkMode ? "text-voltage-purple" : "text-solar-yellow"
                  }`}
                />
              ),
              title: "Renewable Focus",
              description: "Support green energy producers in your community",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`p-6 rounded-xl ${
                darkMode ? "bg-dark" : "bg-energy-light"
              } flex flex-col items-center text-center`}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3
                className={`text-xl font-semibold mb-2 ${
                  darkMode ? "text-dark-text" : "text-energy-text"
                }`}
              >
                {feature.title}
              </h3>
              <p className={darkMode ? "text-gray-600" : "text-energy-text"}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.p
          className={`mt-12 text-sm ${
            darkMode ? "text-gray-600" : "text-energy-text"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Ready to trade energy?{" "}
          <a
            href="https://metamask.io/download.html"
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${
              darkMode ? "text-dark-primary" : "text-energy-primary"
            }`}
          >
            Install MetaMask
          </a>{" "}
          if you don't have a wallet yet.
        </motion.p>
      </motion.div>
    </div>
  );
}