'use client';

import React, { useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";
import { Form, Button, Alert } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMessages, sendMessageApi } from "../api/chatApi";
import { importPublicKey, importPrivateKey, signMessage, verifySignature } from "../utils/encryption";
import axios from "axios";
import { axiosInstanceWithToken } from "../api/axiosInstance";

const socket = io(process.env.REACT_APP_API_URL);

const ChatWindow = ({ selectedUser }) => {
    const queryClient = useQueryClient();
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const privateKey = localStorage.getItem("privateKey"); // Private Key (Base64)
    
    const [message, setMessage] = useState("");
    const [keysMatch, setKeysMatch] = useState(null);
    const [verificationError, setVerificationError] = useState(null);
    const [receiverPublicKey, setReceiverPublicKey] = useState(null);
    const [decryptedMessages, setDecryptedMessages] = useState([]);
    const [senderPublicKeys, setSenderPublicKeys] = useState({}); // Cache sender public keys

    //    Ref for auto-scrolling
    const messagesEndRef = useRef(null);

    //    Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [decryptedMessages]);

    //    Verify Receiver's Public Key
    useEffect(() => {
        axiosInstanceWithToken.get(`${process.env.REACT_APP_API_URL}/users/${selectedUser.id}`)
            .then(res => {
                let backendPublicKey = res.data.publicKey;
                let gistUrl = res.data.gist_url.replace("gist.github.com", "gist.githubusercontent.com") + "/raw";

                return axios.get(gistUrl).then(gistResponse => {
                    if (backendPublicKey.trim() === gistResponse.data.trim()) {
                        setReceiverPublicKey(backendPublicKey.trim());
                        setKeysMatch(true);
                        queryClient.invalidateQueries(["messages", selectedUser.id]);
                    } else {
                        setKeysMatch(false);
                        setVerificationError("Public key mismatch! Chat cannot be started.");
                    }
                });
            })
            .catch(() => {
                setKeysMatch(false);
                setVerificationError("Error fetching public key.");
            });
    }, [selectedUser.id, queryClient]);

    //    Fetch Messages
    const { data: messages, isLoading } = useQuery({
        queryKey: ["messages", selectedUser.id],
        queryFn: () => fetchMessages(currentUser.userId, selectedUser.id),
        enabled: keysMatch !== null && keysMatch,
    });



    //    Encrypt, Sign, and Send Message
    const encryptAndSignMessage = (message, receiverPublicKeyBase64) => {
        let encryptedForReceiver, encryptedForSender, signature;

        return Promise.all([
            importPublicKey(receiverPublicKeyBase64),
            importPrivateKey(privateKey),
            importPublicKey(currentUser.publicKey)
        ])
        .then(([publicKey, senderPrivateKey, senderPublicKey]) => {
            return window.crypto.subtle.encrypt(
                { name: "RSA-OAEP" },
                publicKey,
                new TextEncoder().encode(message)
            )
            .then(encrypted => {
                encryptedForReceiver = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
                return window.crypto.subtle.encrypt(
                    { name: "RSA-OAEP" },
                    senderPublicKey,
                    new TextEncoder().encode(message)
                );
            })
            .then(encrypted => {
                encryptedForSender = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
                return signMessage(encryptedForReceiver, privateKey);
            })
            .then(signedMessage => {
                signature = signedMessage;
                return { encryptedForReceiver, encryptedForSender, signature };
            });
        })
        .catch(error => {
            console.error("🔴 Encryption/Signing Error:", error);
            return null;
        });
    };

    //    Decrypt and Verify Message for Both Sender & Receiver

    const decryptAndVerifyMessage = useCallback((msg) => {
        let decryptedMessage = null;
        const isReceiver = msg.receiver_id === currentUser.userId;
        const encryptedMessage = isReceiver ? msg.encrypted_for_receiver : msg.encrypted_for_sender;
    
        // If sender's public key is cached, use it; otherwise, fetch it
        const getSenderPublicKey = isReceiver
            ? senderPublicKeys[msg.sender_id]
                ? Promise.resolve(senderPublicKeys[msg.sender_id]) // Use cached key
                : axios.get(`${process.env.REACT_APP_API_URL}/users/${msg.sender_id}`)
                      .then((res) => {
                          const publicKey = res.data.publicKey;
                          setSenderPublicKeys((prev) => ({ ...prev, [msg.sender_id]: publicKey })); // Store in cache
                          return publicKey;
                      })
            : Promise.resolve(null); // If sender, no need for verification
    
        return getSenderPublicKey
            .then((senderPublicKey) => {
                if (isReceiver && senderPublicKey) {
                    return verifySignature(msg.encrypted_for_receiver, msg.signature, senderPublicKey);
                }
                return true; // If sender, assume message is valid
            })
            .then((isValid) => {
                if (!isValid) {
                    throw new Error("⚠️ Signature verification failed! Message may be tampered with.");
                }
    
                return importPrivateKey(privateKey)
                    .then((privateKeyObj) => {
                        return window.crypto.subtle.decrypt(
                            { name: "RSA-OAEP" },
                            privateKeyObj,
                            Uint8Array.from(atob(encryptedMessage), (c) => c.charCodeAt(0))
                        );
                    });
            })
            .then((decrypted) => {
                decryptedMessage = new TextDecoder().decode(decrypted);
                return { decryptedMessage, isValid: true };
            })
            .catch(() => {
                return { decryptedMessage: "⚠️ Message verification failed!", isValid: false };
            });
    }, [privateKey, currentUser.userId, senderPublicKeys]);
    
    //    Process All Messages for Decryption
    useEffect(() => {
        if (!privateKey || !messages) return;
        
        Promise.all(
            messages.map((msg) =>
                decryptAndVerifyMessage(msg).then(({ decryptedMessage, isValid }) => ({
                    ...msg,
                    decrypted_message: isValid ? decryptedMessage : "⚠️ Message verification failed!"
                }))
            )
        ).then((decrypted) => setDecryptedMessages(decrypted));
    }, [messages, privateKey]);

    //    Send Message
    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!keysMatch) return alert("Public key verification failed!");

        encryptAndSignMessage(message, receiverPublicKey)
            .then(encryptedData => {
                if (!encryptedData) {
                    alert("Encryption failed!");
                    return;
                }
                const { encryptedForReceiver, encryptedForSender, signature } = encryptedData;

                if (encryptedForReceiver && encryptedForSender && signature) {
                    const newMessage = {
                        sender_id: currentUser.userId,
                        receiver_id: selectedUser.id,
                        encrypted_for_receiver: encryptedForReceiver,
                        encrypted_for_sender: encryptedForSender,
                        signature: signature,
                        decrypted_message: message,
                        status: "sent"
                    };

                    setDecryptedMessages((prevMessages) => [...prevMessages, newMessage]);

                    socket.emit(
                        "sendMessage",
                        {
                            senderId: currentUser.userId,
                            receiverId: selectedUser.id,
                            encryptedForReceiver: encryptedForReceiver,
                            encryptedForSender: encryptedForSender,
                            signature: signature,
                            name:currentUser.name
                        },
                        () => queryClient.invalidateQueries(["messages", selectedUser.id])
                    );
                }
                setMessage("");
            })
            .catch(console.error);
    };

    return (
        <div style={{ padding: "0 10px", border: "1px solid gray", height: "500px", overflow: "hidden" }}>
        {/*    Sticky Header with Contact Name */}
        <div style={{
            position: "sticky",
            top: 0,
            backgroundColor: "white",
            padding: "10px",
            zIndex: 1,
            borderBottom: "1px solid gray"
        }}>
            <h4>Chat with {selectedUser.full_name}</h4>
        </div>
    
        {verificationError && <Alert variant="danger">{verificationError}</Alert>}
        {keysMatch === null && <Alert variant="warning">Verifying encryption keys...</Alert>}
    
        {keysMatch && (
            <>
                <div style={{ height: "400px", overflowY: "auto", padding: "10px" }}>
                    {isLoading ? "Loading messages..." : decryptedMessages.map((msg, index) => (
                        <div key={index} style={{ display: "flex", justifyContent: msg.sender_id === currentUser.userId ? "flex-end" : "flex-start", marginBottom: "5px" }}>
                            <div style={{
                                maxWidth: "70%",
                                padding: "8px 12px",
                                borderRadius: "10px",
                                backgroundColor: msg.sender_id === currentUser.userId ? "#007bff" : "#e9ecef",
                                color: msg.sender_id === currentUser.userId ? "white" : "black"
                            }}>
                                <strong>{msg.sender_id === currentUser.userId ? "You" : selectedUser.full_name}:</strong>
                                <div>{msg.decrypted_message}</div>
                                {/* {msg.status === "unread" && <span style={{ color: "red" }}> (Unread)</span>} */}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
    
                {/*    Input and Send Button in One Line */}
                <Form className="mt-3" onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px",marginBottom:"5px" }}>
                    <Form.Control
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Button type="submit">Send</Button>
                </Form>
            </>
        )}
    </div>
    
    );
};

export default ChatWindow;
