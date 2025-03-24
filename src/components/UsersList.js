import React from "react";
import { ListGroup, Badge } from "react-bootstrap";

const UsersList = ({ users, onSelectUser }) => {
    return (
        <ListGroup>
            {users.map((user) => {
                return (
                    <ListGroup.Item
                        key={user.id}
                        onClick={() => onSelectUser(user)}
                        action
                        className="d-flex justify-content-between align-items-center"
                    >
                        {user.full_name}
                    </ListGroup.Item>
                );
            })}
        </ListGroup>
    );
};

export default UsersList;
