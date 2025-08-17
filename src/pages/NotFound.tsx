import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">404</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-4 break-words">
          Oops! Page not found
        </p>
        <button 
          onClick={() => navigate('/home')}
          className="text-blue-500 hover:text-blue-700 underline text-sm sm:text-base break-words cursor-pointer"
        >
                      Terug naar Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
