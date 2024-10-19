// components/TopBar.js
import { FaSearch, FaUserCircle } from "react-icons/fa";

const TopBar = () => {
  return (
    <div className="flex items-center justify-between bg-white h-16 px-6 shadow-sm border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button className="text-xl">
          <FaSearch />
        </button>
        <input
          type="text"
          placeholder="Search now"
          className="bg-gray-100 p-2 rounded-md outline-none"
        />
      </div>
      <div className="flex items-center gap-4">
        <FaUserCircle size={24} className="text-gray-600" />
      </div>
    </div>
  );
};

export default TopBar;
