import React, { useState } from "react";
import { Form, Button, Col, Row, Container } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { DisplayMessage } from "./Message";
import validator from "validator";

function LoginForm(props) {
    const [username, setUsername] = useState('user1@gmail.com');
    const [password, setPassword] = useState('exam');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        const credentials = { username, password };

        if (validator.isEmpty(username)) {
            setErrorMessage('Email cannot be empty!');
        } else if (!validator.isEmail(username)) {
            setErrorMessage('Not a valid email!');
        } else if (validator.isEmpty(password)) {
            setErrorMessage('Password cannot be empty!');
        } else {
            props.login(credentials)
                .then(() => navigate(`/user/configuration`))
                .catch((err) => {
                    setErrorMessage(err.error);
                });
        }
    };

    return (
        <Container className="login-container d-flex justify-content-center align-items-start">
            <Row className="w-100 justify-content-center">
                <Col xs={10} sm={8} md={6} lg={4}>
                    <div className="p-4 bg-dark rounded shadow">
                        <h1 className="my-4 pb-3 text-center">Login</h1>
                        <Form data-bs-theme="dark" onSubmit={handleSubmit}>
                            <DisplayMessage
                                errorMessage={errorMessage}
                                setErrorMessage={setErrorMessage}
                            />
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={username}
                                    placeholder="Enter email"
                                    onChange={(ev) => setUsername(ev.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={password}
                                    placeholder="Enter your password"
                                    onChange={(ev) => setPassword(ev.target.value)}
                                />
                            </Form.Group>
                            <div className="d-grid gap-2">
                                <Button className="custom-button" variant="primary" type="submit">
                                    Login
                                </Button>
                                <Button variant="outline-secondary" onClick={() => navigate("/")}>
                                    Back
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

function LogoutButton(props) {
    return (
        <Button variant="outline-light" onClick={props.logout}>Logout</Button>
    );
}

function LoginButton() {
    const navigate = useNavigate();
    return (
        <Button variant="outline-light" onClick={() => navigate('/login')}>Login</Button>
    );
}

export { LoginForm, LogoutButton, LoginButton };
