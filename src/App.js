import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Home from "./pages/Home";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { setTokenToHeader } from "./api/axiosInstance";


const queryClient = new QueryClient();

//   Private Route Wrapper
const PrivateRoute = ({ element }) => {
    const token = localStorage.getItem("token");
   token && setTokenToHeader(token)
    return token ? element : <Navigate to="/signin" replace />;
};

//   Router Configuration
const router = createBrowserRouter([
    { path: "/", element: <Navigate to="/signin" replace /> },  // Redirect to signin by default
    { path: "/signup", element: <Signup /> },
    { path: "/signin", element: <Signin /> },
    { path: "/home", element: <PrivateRoute element={<Home />} /> }, //   Protected Home Route
    { path: "*", element: <Navigate to="/signin" replace /> } // Redirect unknown paths to signin
]);


const App = () => {
    return (
        <GoogleOAuthProvider clientId="108332963897-0gi01uh23ru8p46jqq6c9nldguvliut4.apps.googleusercontent.com">
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <ToastContainer />
            </QueryClientProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
