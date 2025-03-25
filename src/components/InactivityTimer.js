import React, { useEffect, useState, useRef } from "react";

const InactivityTimer = ({ onLogout }) => {
    const [timeLeft, setTimeLeft] = useState(60);
    const [showOverlay, setShowOverlay] = useState(false);
    const hasLoggedOut = useRef(false);
    const timerRef = useRef(null);
    const countdownRef = useRef(null);

    const resetTimer = () => {
        clearTimeout(timerRef.current);
        clearInterval(countdownRef.current);
        setShowOverlay(false);
        setTimeLeft(60);
        startTimers();
    };

    const startTimers = () => {
        timerRef.current = setTimeout(() => {
            setShowOverlay(true);
            countdownRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === 1) {
                        clearInterval(countdownRef.current);
                        if (!hasLoggedOut.current) {
                            hasLoggedOut.current = true; //   prevent double logout
                            onLogout();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, 60 * 1000); // 1 min of inactivity
    };

    useEffect(() => {
        hasLoggedOut.current = false; // Reset on mount

        startTimers();

        const events = ["mousemove", "keydown", "click", "scroll"];
        events.forEach((event) => window.addEventListener(event, resetTimer));

        return () => {
            clearTimeout(timerRef.current);
            clearInterval(countdownRef.current);
            events.forEach((event) => window.removeEventListener(event, resetTimer));
        };
    }, []);

    return showOverlay ? (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "2rem",
            zIndex: 9999
        }}>
            Logging out in {timeLeft} seconds due to inactivity...
        </div>
    ) : null;
};

export default InactivityTimer;
