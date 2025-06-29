import { useEffect, useState, useRef } from "react";
import { useTheme } from "../components/ThemeContext";
import { LightningIcon, BoltIcon } from "../components/Icons";
import { Grid } from "react-loader-spinner";

const TABLE_HEAD = [
  "Timestamp",
  "Device ID",
  "Voltage (V)",
  "Current (A)",
  "Power (W)",
  "Energy (kWh)",
  "Frequency (Hz)",
  "Power Factor"
];

const API_URL = "https://script.google.com/macros/s/AKfycby1RvGRqATEuTqNbJsT_owH1PQx3jSJ0bNc7L0rkmB1J6bP6guO9p4VPJSB58ud6urE/exec?type=0";

export default function EnergyRecords() {
  const { darkMode } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const tableRef = useRef(null);
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle touch/mouse events for swipe scrolling
  const handleDragStart = (e) => {
    setIsDragging(true);
    setStartX(e.type.includes('touch') ? e.touches[0].pageX : e.pageX);
    setScrollLeft(tableRef.current.scrollLeft);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    const walk = (x - startX) * 2;
    tableRef.current.scrollLeft = scrollLeft - walk;
    syncScrollBars();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Sync scroll positions
  const syncScrollBars = () => {
    if (tableRef.current) {
      const scrollPos = tableRef.current.scrollLeft;
      topScrollRef.current.scrollLeft = scrollPos;
      bottomScrollRef.current.scrollLeft = scrollPos;
    }
  };

  const handleScrollBarChange = (e) => {
    const scrollPos = e.target.scrollLeft;
    tableRef.current.scrollLeft = scrollPos;
    if (e.target === topScrollRef.current) {
      bottomScrollRef.current.scrollLeft = scrollPos;
    } else {
      topScrollRef.current.scrollLeft = scrollPos;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    let intervalId;
    if (isAutoRefresh) {
      intervalId = setInterval(fetchData, 5000);
    }

    return () => clearInterval(intervalId);
  }, [isAutoRefresh]);

  // Initialize scroll sync
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.addEventListener('scroll', syncScrollBars);
    }
    return () => {
      if (tableRef.current) {
        tableRef.current.removeEventListener('scroll', syncScrollBars);
      }
    };
  }, []);

  return (
    <div className={`w-full p-4 sm:p-8 ${darkMode ? "bg-energy-dark" : "bg-energy-light"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className={`text-3xl font-bold flex items-center ${darkMode ? "text-dark-text" : "text-energy-text"}`}>
            <LightningIcon className={`w-8 h-8 mr-2 ${darkMode ? "text-energy-secondary" : "text-energy-primary"}`} />
            Energy Monitoring Dashboard
          </h2>
          <p className={`mt-2 ${darkMode ? "text-dark-off" : "text-gray-600"}`}>
            Real-time energy consumption records from your devices
          </p>
        </div>

        <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? "bg-energy-dark/80 border border-energy-secondary/20" : "bg-white border border-gray-200"}`}>
          <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-energy-secondary/20">
            <div className="flex items-center">
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`p-2 rounded-lg mr-4 ${darkMode ? "hover:bg-energy-dark" : "hover:bg-gray-100"}`}
              >
                {isAutoRefresh ? (
                  <span className={`flex items-center ${darkMode ? "text-energy-secondary" : "text-energy-primary"}`}>
                    <BoltIcon className="w-5 h-5 mr-1" />
                    Live Updating
                  </span>
                ) : (
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                    Updates Paused
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={fetchData}
              className={`px-4 py-2 rounded-lg flex items-center ${darkMode ? "bg-energy-secondary hover:bg-energy-secondary/90 text-white" : "bg-energy-primary hover:bg-energy-primary/90 text-white"}`}
            >
              Refresh Now
            </button>
          </div>

          {/* Top Scrollbar */}
          <div 
            ref={topScrollRef}
            onScroll={handleScrollBarChange}
            className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
          >
            <div className="h-1 min-w-full" style={{ width: `${TABLE_HEAD.length * 150}px` }}></div>
          </div>

          {/* Main Table with swipe support */}
          <div 
            ref={tableRef}
            className="overflow-x-auto"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <table className="w-full min-w-max">
              <thead>
                <tr className={`${darkMode ? "bg-energy-dark/50" : "bg-gray-50"}`}>
                  {TABLE_HEAD.map((head) => (
                    <th
                      key={head}
                      className={`p-4 text-left whitespace-nowrap ${darkMode ? "text-dark-text" : "text-gray-700"}`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="p-8 text-center">
                      <div className="flex justify-center">
                        <Grid
                          visible={true}
                          height="60"
                          width="60"
                          color={darkMode ? "#3B82F6" : "#1E40AF"}
                          ariaLabel="grid-loading"
                          radius="9.5"
                          wrapperClass="grid-wrapper"
                        />
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((record, index) => (
                    <tr
                      key={index}
                      className={`${index % 2 === 0 ? (darkMode ? "bg-energy-dark/30" : "bg-gray-50") : ""} border-b ${darkMode ? "border-energy-secondary/10" : "border-gray-200"}`}
                    >
                      <td className="p-4 whitespace-nowrap">
                        <span className={darkMode ? "text-dark-text" : "text-gray-600"}>{record.timestamp}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`font-mono ${darkMode ? "text-energy-secondary" : "text-energy-primary"}`}>
                          {record.energyMeterID}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={darkMode ? "text-dark-text" : "text-gray-800"}>{record.voltage}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={darkMode ? "text-dark-text" : "text-gray-800"}>{record.current}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={darkMode ? "text-dark-text" : "text-gray-800"}>{record.power}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={darkMode ? "text-dark-text" : "text-gray-800"}>{record.energy}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={darkMode ? "text-dark-text" : "text-gray-800"}>{record.frequency}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={darkMode ? "text-dark-text" : "text-gray-800"}>{record.pf}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Scrollbar */}
          <div 
            ref={bottomScrollRef}
            onScroll={handleScrollBarChange}
            className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
          >
            <div className="h-1 min-w-full" style={{ width: `${TABLE_HEAD.length * 150}px` }}></div>
          </div>
        </div>

        {data.length === 0 && !loading && (
          <div className={`text-center py-12 ${darkMode ? "text-dark-off" : "text-gray-500"}`}>
            No energy records found. Data will appear here once available.
          </div>
        )}
      </div>
    </div>
  );
}