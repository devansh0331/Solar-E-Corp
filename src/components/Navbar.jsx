import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { Link, NavLink, useLocation } from "react-router-dom";
import { MenuIcon, XIcon, MoonIcon, SunIcon, WalletIcon, LightningIcon , SolarPanelIcon} from "./Icons";
import { ethers } from "ethers";

export default function Navbar({ account, setAccount, setProvider, setContract, userType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
      } else {
        alert("Please install MetaMask!");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Define navigation items based on account and registration status
  const getNavItems = () => {
    const baseItems = [
      { name: "Home", path: "/" },
      { name: "Market Place", path: "/market" },
      { name: "Energy Records", path: "/records" }
    ];

    // Case 1 & 2: Not connected or connected but not registered
    if (!account || (account && !userType)) {
      return [...baseItems, { name: "Register", path: "/register" }];
    }

    // Case 3: Connected and registered
    return [...baseItems, { name: "Dashboard", path: `/dashboard/${userType}` }];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Energy-Themed Navbar */}
      <motion.nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          darkMode
            ? scrolled
              ? "bg-energy-dark/90 backdrop-blur-md border-b border-energy-secondary/20"
              : "bg-energy-dark border-b border-energy-secondary/10"
            : scrolled
            ? "bg-white/90 backdrop-blur-md border-b border-gray-200"
            : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center"
              >
                <SolarPanelIcon className={`w-6 h-6 mr-2 ${
                  darkMode ? "text-energy-secondary" : "text-solar-red"
                }`} />
                <span className={`text-2xl font-bold ${
                  darkMode 
                    ? "text-energy-secondary" 
                    : "text-solar-red"
                }`}>
                  Solar E-Corp
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex space-x-6">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-1 py-2 text-md font-medium transition-colors relative ${
                        isActive
                          ? darkMode
                            ? "text-energy-secondary"
                            : "text-energy-primary"
                          : darkMode
                          ? "text-dark-text hover:text-energy-secondary"
                          : "text-energy-text hover:text-energy-primary"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {item.name}
                        {isActive && (
                          <motion.div
                            layoutId="navUnderline"
                            className={`absolute bottom-0 left-0 w-full h-0.5 ${
                              darkMode
                                ? "bg-energy-secondary"
                                : "bg-energy-primary"
                            }`}
                            transition={{ type: "spring", bounce: 0.25 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full ${
                  darkMode
                    ? "text-energy-secondary hover:bg-energy-dark"
                    : "text-energy-primary hover:bg-energy-light"
                }`}
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </motion.button>

              {/* Wallet Connection Button */}
              {account ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                    darkMode
                      ? "bg-energy-dark border border-energy-secondary/30 text-energy-secondary"
                      : "bg-energy-light border border-energy-primary/20 text-energy-primary"
                  }`}
                >
                  <WalletIcon className="w-4 h-4 mr-2" />
                  {`${account.slice(0, 6)}...${account.slice(-4)}`}
                </motion.div>
              ) : (
                <motion.button
                  onClick={connectWallet}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center ${
                    darkMode
                      ? "bg-gradient-to-r from-energy-secondary to-grid-green text-white"
                      : "bg-gradient-to-r from-energy-primary to-energy-accent text-white"
                  }`}
                >
                  <WalletIcon className="w-4 h-4 mr-2" />
                  Connect Wallet
                </motion.button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-4">
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full ${
                  darkMode
                    ? "text-energy-secondary hover:bg-energy-dark"
                    : "text-energy-primary hover:bg-energy-light"
                }`}
              >
                {darkMode ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </motion.button>

              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-md ${
                  darkMode
                    ? "text-dark-text hover:bg-energy-dark"
                    : "text-energy-text hover:bg-energy-light"
                }`}
                aria-label="Toggle menu"
              >
                {isOpen ? (
                  <XIcon className="w-5 h-5" />
                ) : (
                  <MenuIcon className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`md:hidden overflow-hidden ${
                darkMode ? "bg-energy-dark" : "bg-white"
              }`}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? darkMode
                            ? "bg-energy-dark text-energy-secondary"
                            : "bg-energy-light text-energy-primary"
                          : darkMode
                          ? "text-dark-text hover:bg-energy-dark hover:text-energy-secondary"
                          : "text-energy-text hover:bg-energy-light hover:text-energy-primary"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
                <div className="px-3 py-3">
                  {account ? (
                    <div
                      className={`flex items-center text-sm ${
                        darkMode ? "text-dark-off" : "text-energy-text"
                      }`}
                    >
                      <WalletIcon className="w-4 h-4 mr-2" />
                      {`${account.slice(0, 6)}...${account.slice(-4)}`}
                    </div>
                  ) : (
                    <motion.button
                      onClick={connectWallet}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium ${
                        darkMode
                          ? "bg-gradient-to-r from-energy-secondary to-grid-green text-white"
                          : "bg-gradient-to-r from-energy-primary to-energy-accent text-white"
                      }`}
                    >
                      <WalletIcon className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20"></div>
    </>
  );
}