import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useOAuthSignin } from "../api/authApi";
import { Container, Alert, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import CryptoJS from "crypto-js";

const Signin = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [showUploadButton, setShowUploadButton] = useState(false);
    const googleSigninMutation = useOAuthSignin("google");

    // Function to initialize IndexedDB and ensure object store exists
    const initializeIndexedDB = () => {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open("SecureChatDB", 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("keys")) {
                    db.createObjectStore("keys", { keyPath: "id" });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to open IndexedDB");
        });
    };

    // Function to check if SecureChatDB exists
    const checkDatabaseExists = async () => {
        try {
            const db = await initializeIndexedDB();
            return db.objectStoreNames.contains("keys");
        } catch {
            return false;
        }
    };

    // Function to retrieve & decrypt private key
    const handlePrivateKeyRetrieval = async (email) => {
        const dbExists = await checkDatabaseExists();
        if (!dbExists) {
            setMessage("SecureChatDB not found! Please upload your private key file.");
            setShowUploadButton(true);
            return;
        }

        const db = await initializeIndexedDB();
        const tx = db.transaction("keys", "readonly");
        const store = tx.objectStore("keys");
        const request = store.get(email);

        request.onsuccess = () => {
            if (request.result) {
                askForPasswordAndDecrypt(email, request.result.key);
            } else {
                setMessage("No private key found for this email! Please upload your private key file.");
                setShowUploadButton(true);
            }
        };
    };

    // Ask user for password until the correct one is entered
    const askForPasswordAndDecrypt = (email, encryptedKey) => {
        let privateKeyBase64 = "";
        while (!privateKeyBase64) {
            const privateKeyPassword = prompt("Enter your private key password:");
            if (!privateKeyPassword) {
                alert("Private key password required!");
                return;
            }
            
            try {
                // Decrypt stored key
                console.log(email)
                const decryptedBytes = CryptoJS.AES.decrypt(encryptedKey, privateKeyPassword);
                privateKeyBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
                if (!privateKeyBase64) throw new Error("Decryption failed");
    
                localStorage.setItem("privateKey", privateKeyBase64);
                console.log("   Private Key Decrypted & Stored in localStorage");
                navigate("/home"); // Navigate only after successful decryption
            } catch (error) {
                console.error("  Error decrypting private key:", error);
                alert("Failed to decrypt private key! Check password.");
            }
        }
    };

    // Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const privateKey = e.target.result;
                storePrivateKeyInIndexedDB(privateKey);
            };
            reader.readAsText(file);
        }
    };

    // Store uploaded private key in IndexedDB
    const storePrivateKeyInIndexedDB = async (privateKey) => {
        const email = prompt("Enter your email associated with this key:");
        if (!email) return alert("Email is required to store the key!");

        const passwordForKey = prompt("Set a password to encrypt your private key:");
        if (!passwordForKey) return alert("Private key password required!");
        console.log(privateKey)
                const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, passwordForKey).toString();
    
        try {
            // const db = await initializeIndexedDB();
            // const tx = db.transaction("keys", "readwrite");
            // const store = tx.objectStore("keys");
            // store.put({ id: email, key: encryptedPrivateKey });
            // console.log("UPDALOD")
            const db = window.indexedDB.open("SecureChatDB", 1);
                db.onupgradeneeded = () => {
                    const store = db.result.createObjectStore("keys", { keyPath: "id" });
                };
                db.onsuccess = () => {
                    const tx = db.result.transaction("keys", "readwrite");
                    const store = tx.objectStore("keys");
                    store.put({ id: email, key: encryptedPrivateKey });
                };
            alert("Private key uploaded and stored securely!");
            setShowUploadButton(false);
            handlePrivateKeyRetrieval(email)
            // setMessage("Private key stored successfully! You can now sign in.");
        } catch (error) {
            console.error("  Error storing private key:", error);
        }
    };

    // Handle Google Sign-In
    const handleGoogleSignin = async (response) => {
        const { credential } = response;
        if (!credential) {
            setMessage("Google Sign-In Failed");
            return;
        }

        // Decode Google credential to extract email
        const userInfo = JSON.parse(atob(credential.split(".")[1]));
        const email = userInfo.email;

        googleSigninMutation.mutate({ token: credential, email }, {
            onSuccess: (data) => {
                console.log("DATA", data);
                localStorage.setItem("token", data.data.token);
                localStorage.setItem("user", JSON.stringify(data.data.userData));
                handlePrivateKeyRetrieval(email);
            },
            onError: () => setMessage("Google Sign-In failed"),
        });
    };

    return (
        <Container className="mt-5">
            <h2>Sign In</h2>
            {message && <Alert variant="info">{message}</Alert>}
            <GoogleLogin onSuccess={handleGoogleSignin} onError={() => setMessage("Google Login Failed")} />
            {showUploadButton && (
                <div className="mt-3">
                    <input type="file" accept=".pem" onChange={handleFileUpload} />
                </div>
            )}
            <p className="mt-3">
                 Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
        </Container>
    );
};

export default Signin;



// const handlePrivateKeyRetrieval = (email) => {
    //         const privateKeyPassword = prompt("Enter your private key password:");
    //         if (!privateKeyPassword) return alert("Private key password required!");
        
    //         // Retrieve & Decrypt Private Key from IndexedDB
    //         const db = window.indexedDB.open("SecureChatDB", 1);
        
    //         db.onsuccess = () => {
    //             const dbInstance = db.result;
    //             const tx = dbInstance.transaction("keys", "readonly");
    //             const store = tx.objectStore("keys");
    //             const request = store.get(email);
        
    //             request.onsuccess = () => {
    //                 if (request.result) {
    //                     try {
    //                         // Decrypt stored key
    //                         const decryptedBytes = CryptoJS.AES.decrypt(request.result.key, privateKeyPassword);
    //                         const privateKeyBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
    //                         if (!privateKeyBase64) throw new Error("Decryption failed");
        
    //                         localStorage.setItem("privateKey", privateKeyBase64);
    //                         console.log("   Private Key Decrypted & Stored in localStorage");
        
    //                     } catch (error) {
    //                         console.error("  Error decrypting private key:", error);
    //                         alert("Failed to decrypt private key! Check password.");
    //                     }
    //                 } else {
    //                     alert("No private key found for this email!");
    //                 }
    //             };
        
    //             request.onerror = () => {
    //                 console.error("  Error retrieving private key from IndexedDB");
    //             };
    //         };
    //     };
        