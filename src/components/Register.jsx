import { motion } from "framer-motion";
import { useTheme } from "../components/ThemeContext";
// import { LightningIcon, SolarPanelIcon } from "../components/Icons";
import { LightningIcon, SolarPanelIcon, BoltIcon } from "../components/Icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register({ contract, account, setUserType }) {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const registerUser = async (type) => {
    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (type === "producer") {
        const tx = await contract.registerProducer();
        await tx.wait();
      } else {
        const tx = await contract.registerConsumer();
        await tx.wait();
      }
      setUserType(type);
      navigate(`/dashboard/${type}`);
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-6"
          >
            <LightningIcon
              className={`w-12 h-12 ${
                darkMode ? "text-energy-secondary" : "text-energy-primary"
              }`}
            />
          </motion.div>
          <motion.h1
            className={`text-4xl md:text-5xl font-bold mb-4 ${
              darkMode ? "text-dark-text" : "text-energy-text"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Join EnergyTrade
          </motion.h1>
          <motion.p
            className={`text-lg ${
              darkMode ? "text-white" : "text-energy-text"
            } max-w-xl mx-auto`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Register as an energy producer or consumer to start trading
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Producer Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className={`rounded-xl p-8 shadow-lg transition-all ${
              darkMode
                ? "bg-gradient-to-br from-energy-dark to-energy-dark/80 border border-energy-secondary/20"
                : "bg-gradient-to-br from-white to-gray-50 border border-gray-100"
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-6">
                <div
                  className={`p-3 rounded-full mr-4 ${
                    darkMode ? "bg-energy-dark/50" : "bg-energy-light"
                  }`}
                >
                  <SolarPanelIcon
                    className={`w-8 h-8 ${
                      darkMode ? "text-solar-yellow" : "text-energy-primary"
                    }`}
                  />
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    darkMode ? "text-energy-secondary" : "text-energy-primary"
                  }`}
                >
                  Energy Producer
                </h2>
              </div>
              <p
                className={`mb-6 flex-grow ${
                  darkMode ? "text-white" : "text-gray-600"
                }`}
              >
                List your renewable energy production, set your rates, and connect directly
                with consumers in your area.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Set your energy rates",
                  "List available capacity",
                  "Get paid automatically",
                  "24/7 monitoring",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <SolarPanelIcon
                      className={`flex-shrink-0 w-5 mt-1 mr-3 ${
                        darkMode ? "text-solar-yellow" : "text-energy-accent"
                      }`}
                    />
                    <span className={darkMode ? "text-white" : "text-gray-600"}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <motion.button
                onClick={() => registerUser("producer")}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-medium ${
                  darkMode
                    ? "bg-gradient-to-r from-energy-secondary to-grid-green hover:from-energy-secondary/90 hover:to-grid-green/90"
                    : "bg-gradient-to-r from-energy-primary to-energy-accent hover:from-energy-primary/90 hover:to-energy-accent/90"
                } text-white shadow-md`}
              >
                {loading ? "Registering..." : "Register as Producer"}
              </motion.button>
            </div>
          </motion.div>

          {/* Consumer Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className={`rounded-xl p-8 shadow-lg transition-all ${
              darkMode
                ? "bg-gradient-to-br from-energy-dark to-energy-dark/80 border border-energy-secondary/20"
                : "bg-gradient-to-br from-white to-gray-50 border border-gray-100"
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-6">
                <div
                  className={`p-3 rounded-full mr-4 ${
                    darkMode ? "bg-energy-dark/50" : "bg-energy-light"
                  }`}
                >
                  <BoltIcon
                    className={`w-8 h-8 ${
                      darkMode ? "text-voltage-purple" : "text-energy-accent"
                    }`}
                  />
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    darkMode ? "text-energy-secondary" : "text-energy-primary"
                  }`}
                >
                  Energy Consumer
                </h2>
              </div>
              <p
                className={`mb-6 flex-grow ${
                  darkMode ? "text-white" : "text-gray-600"
                }`}
              >
                Access clean energy directly from local producers at competitive rates with
                transparent pricing.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Browse local producers",
                  "Request energy supply",
                  "Pay per kWh used",
                  "Track your consumption",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <BoltIcon
                      className={`flex-shrink-0 w-5 mt-1 mr-3 ${
                        darkMode ? "text-voltage-purple" : "text-energy-accent"
                      }`}
                    />
                    <span className={darkMode ? "text-white" : "text-gray-600"}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <motion.button
                onClick={() => registerUser("consumer")}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-medium ${
                  darkMode
                    ? "bg-gradient-to-r from-voltage-purple to-energy-secondary hover:from-voltage-purple/90 hover:to-energy-secondary/90"
                    : "bg-gradient-to-r from-energy-accent to-energy-primary hover:from-energy-accent/90 hover:to-energy-primary/90"
                } text-white shadow-md`}
              >
                {loading ? "Registering..." : "Register as Consumer"}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-6 p-4 rounded-lg text-center ${
              darkMode ? "bg-power-red/20 text-power-red" : "bg-power-red/10 text-power-red"
            }`}
          >
            {error}
          </motion.div>
        )}

        {/* Footer Note */}
        <motion.p
          className={`mt-12 text-sm text-center ${
            darkMode ? "text-white" : "text-gray-500"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Already registered?{" "}
          <button
            onClick={() => navigate("/")}
            className={`underline ${
              darkMode ? "text-energy-secondary" : "text-energy-primary"
            } font-medium`}
          >
            Connect your wallet
          </button>{" "}
          to access your dashboard.
        </motion.p>
      </motion.div>
    </div>
  );
}