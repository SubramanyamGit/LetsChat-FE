import React, { useState } from "react";
import { ListGroup, Form } from "react-bootstrap";

const UsersList = ({ users, onSelectUser }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users.filter((user) =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Form.Control
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
            />
            <ListGroup>
                {filteredUsers.map((user) => (
                    <ListGroup.Item
                        key={user.id}
                        onClick={() => onSelectUser(user)}
                        action
                        className="d-flex justify-content-between align-items-center"
                    >
                        {user.full_name}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </>
    );
};

export default UsersList;
