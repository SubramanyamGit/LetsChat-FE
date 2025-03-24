import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

//    Redirects authenticated users from Signin/Signup to Home
const useAuthRedirect = () => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/home", { replace: true });
        }
    }, [navigate]);
};

export default useAuthRedirect;
