export const importPublicKey = (publicKeyBase64) => {
    return new Promise((resolve, reject) => {
        try {
            const binaryDer = Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0));

            window.crypto.subtle.importKey(
                "spki",
                binaryDer.buffer,
                { name: "RSA-OAEP", hash: "SHA-256" },
                true,
                ["encrypt"]
            )
            .then(resolve)
            .catch((error) => {
                console.error("   Public Key Import Error:", error);
                reject(error);
            });
        } catch (error) {
            console.error("   Public Key Import Error:", error);
            reject(error);
        }
    });
};


export const importPrivateKey = (privateKeyBase64) => {
    return new Promise((resolve, reject) => {
        try {
            const binaryDer = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));

            window.crypto.subtle.importKey(
                "pkcs8",
                binaryDer.buffer,
                { name: "RSA-OAEP", hash: "SHA-256" },
                true,
                ["decrypt"]
            )
            .then(resolve)
            .catch((error) => {
                console.error("   Private Key Import Error:", error);
                reject(error);
            });
        } catch (error) {
            console.error("   Private Key Import Error:", error);
            reject(error);
        }
    });
};

//    Import Private Key for Signing (RSA-PSS)
export const importSigningPrivateKey = (privateKeyBase64) => {
    return new Promise((resolve, reject) => {
        try {
            const binaryDer = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));
            window.crypto.subtle.importKey(
                "pkcs8",
                binaryDer.buffer,
                { name: "RSA-PSS", hash: "SHA-256" },
                true,
                ["sign"]
            )
            .then(resolve)
            .catch((error) => {
                console.error("   Signing Private Key Import Error:", error);
                reject(null);
            });
        } catch (error) {
            console.error("   Signing Private Key Import Error:", error);
            reject(null);
        }
    });
};

//    Import Public Key for Verification (RSA-PSS)
export const importSigningPublicKey = (publicKeyBase64) => {
    return new Promise((resolve, reject) => {
        try {
            const binaryDer = Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0));
            window.crypto.subtle.importKey(
                "spki",
                binaryDer.buffer,
                { name: "RSA-PSS", hash: "SHA-256" },
                true,
                ["verify"]
            )
            .then(resolve)
            .catch((error) => {
                console.error("   Signing Public Key Import Error:", error);
                reject(null);
            });
        } catch (error) {
            console.error("   Signing Public Key Import Error:", error);
            reject(null);
        }
    });
};

//    Sign a Message with RSA-PSS
export const signMessage = (message, privateKeyBase64) => {
    return importSigningPrivateKey(privateKeyBase64)
        .then((privateKey) => {
            const encodedMessage = new TextEncoder().encode(message);
            return window.crypto.subtle.sign(
                { name: "RSA-PSS", saltLength: 32 },
                privateKey,
                encodedMessage
            );
        })
        .then((signature) => {
            return btoa(String.fromCharCode(...new Uint8Array(signature))); // Convert signature to Base64
        })
        .catch((error) => {
            console.error("   Signing Error:", error);
            return null;
        });
};

//    Verify Signature with Sender's Public Key
export const verifySignature = (message, signatureBase64, senderPublicKeyBase64) => {
    return importSigningPublicKey(senderPublicKeyBase64)
        .then((publicKey) => {
            const encodedMessage = new TextEncoder().encode(message);
            const signature = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));

            return window.crypto.subtle.verify(
                { name: "RSA-PSS", saltLength: 32 },
                publicKey,
                signature,
                encodedMessage
            );
        })
        .catch((error) => {
            console.error("   Signature Verification Error:", error);
            return false; // Verification failed
        });
};