import React, { useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import { useOAuthSignup } from '../api/authApi';
import { Container, Alert } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import CryptoJS from "crypto-js";

const Signup = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const googleSignupMutation = useOAuthSignup("google");


   // Download Private Key as a PEM file
   const downloadPrivateKey = (privateKey) => {
    const blob = new Blob([privateKey], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "private_key.pem";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  // Generate Keys & Store Private Key Securely
  const handleKeyGeneration = (email, fullName, token) => {
    const passwordForKey = prompt("Set a password for your private key:");
    if (!passwordForKey) return alert("Private key password required!");

    // Generate RSA Key Pair
    window.crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, hash: "SHA-256", publicExponent: new Uint8Array([1, 0, 1]) },
        true, ["encrypt", "decrypt"]
    ).then((keyPair) => {
        // Export Private Key
        return window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
            .then((privateKeyBuffer) => {
                // Convert private key to Base64
                const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

                // Encrypt Private Key before storing
                const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKeyBase64, passwordForKey).toString();

                // Store Private Key in IndexedDB
                const db = window.indexedDB.open("SecureChatDB", 1);
                db.onupgradeneeded = () => {
                    const store = db.result.createObjectStore("keys", { keyPath: "id" });
                };
                db.onsuccess = () => {
                    const tx = db.result.transaction("keys", "readwrite");
                    const store = tx.objectStore("keys");
                    store.put({ id: email, key: encryptedPrivateKey });
                };

                // Download Private Key as PEM file
                downloadPrivateKey(privateKeyBase64);

                // Store Public Key
                return window.crypto.subtle.exportKey("spki", keyPair.publicKey);
            })
            .then((publicKeyBuffer) => {
                const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

                googleSignupMutation.mutate({ token, email, full_name: fullName, publicKey: publicKeyBase64 }, {
                    onSuccess: () => {
                        setMessage("Google Signup successful!");
                        setTimeout(() => navigate("/signin"), 2000);
                    },
                    onError: (error) => setMessage(error.response.data.error),
                });
            });
    });
};


    // Handle Google Signup
    const handleGoogleSignup = async (response) => {
        const { credential } = response;
        if (!credential) {
            setMessage("Google Signup Failed");
            return;
        }

        // Decode Google credential to extract email
        const userInfo = JSON.parse(atob(credential.split(".")[1]));
        const email = userInfo.email;
        const fullName = userInfo.name;

        await handleKeyGeneration(email, fullName, credential);
    };

    
    return (
        <Container className="mt-5">
            <h2>Sign Up</h2>
            {message && <Alert variant="info">{message}</Alert>}
            <GoogleLogin onSuccess={handleGoogleSignup} onError={() => setMessage("Google Login Failed")} text='signup_with' />
            <p className="mt-3">
                Already have an account? <Link to="/signin">Sign In</Link>
             </p>
        </Container>
    );
};

export default Signup;
