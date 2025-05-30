import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers } from "../api/usersApi";
import { useLogout } from "../api/authApi";
import UsersList from "../components/UsersList";
import ChatWindow from "../components/ChatWindow";
import InactivityTimer from "../components/InactivityTimer";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import io from "socket.io-client";


const socket = io(process.env.REACT_APP_API_URL);
const Home = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const logoutMutation = useLogout();

    // Get current logged-in user
    const currentUser = JSON.parse(localStorage.getItem("user"));

    // Fetch users list (excluding current user)
    const { data: users, isLoading, error } = useQuery({
        queryKey: ["users"],
        queryFn: fetchUsers,
        select: (users) => users.filter(user => user.id !== currentUser.userId) // Exclude current user
    });


    // Mark messages as read when a user is selected
    useEffect(() => {
        if (selectedUser) {
            queryClient.invalidateQueries(["messages", selectedUser.id]); // Refetch messages
        }
    }, [selectedUser, queryClient]);

    
        useEffect(() => {
            socket.on(`receiveMessage-${currentUser.userId}`, ({name,senderId}) => {
                toast.info(`New Message From ${name}`)
                queryClient.invalidateQueries(["messages", senderId]);
                queryClient.invalidateQueries(["unreadMessages", currentUser.userId]);
            });
    
            return () => socket.off(`receiveMessage-${currentUser.userId}`);
        }, [ queryClient]);

        const onLogout = () => {
            logoutMutation.mutate(null, {
                onSuccess: () => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("privateKey");
                    localStorage.removeItem("user");
                    navigate("/signin");
                },
                onError: () => {
                    toast.error("Logout failed from Backend");
                    localStorage.removeItem("token");
                    localStorage.removeItem("privateKey");
                    localStorage.removeItem("user");
                    navigate("/signin");
                },
            });
        };

    if (isLoading) return <div>Loading users...</div>;
    if (error) return <div>Error loading users: {error.message}</div>;

    

    return (
        <Container>
             <InactivityTimer onLogout={onLogout} />
            <div className="d-flex justify-content-between align-items-center">
                <h2> Let's Chat</h2>
                <Button variant="danger" onClick={onLogout}>Logout</Button>
            </div>
            <Row>
                <Col md={4}>
                    <UsersList users={users} onSelectUser={setSelectedUser} />
                </Col>
                <Col md={8}>
                    {selectedUser ? <ChatWindow selectedUser={selectedUser} /> : <div>Select a user to chat</div>}
                </Col>
            </Row>
        </Container>
    );
};

export default Home;
