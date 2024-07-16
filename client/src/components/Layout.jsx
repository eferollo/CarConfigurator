import {Row, Col, Button, Container} from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { LoginForm } from './Auth';
import { Navigation } from "./Navigation";
import { CarConfigurator } from "./CarConfigurator";
import { UserConfiguration } from "./UserConfiguration";

import React, {useState} from "react";

function NotFoundLayout() {
    return (
        <Container className="d-flex flex-column justify-content-center align-items-center vh-100">
            <Row className="text-center">
                <Col>
                    <h2 className="mb-4">Oops! This page does not exist!</h2>
                    <Link to="/" className="text-decoration-none">
                        <Button variant="primary">Go back to the main page</Button>
                    </Link>
                </Col>
            </Row>
        </Container>
    );
}

function LoginLayout(props) {
    return (
        <Row>
            <Col>
                <LoginForm login={props.login} />
            </Col>
        </Row>
    );
}

function UserConfigurationLayout(props) {
    const [editMode, setEditMode] = useState(false);
    const [newMode, setNewMode] = useState(false);

    return (
        <>
            <Row>
                <Col>
                    <Navigation
                        loggedIn={props.loggedIn}
                        user={props.user}
                        logout={props.logout}
                    />
                </Col>
            </Row>
            <Row>
                <Container data-bs-theme="dark" fluid className="mt-4 d-flex" style={{ paddingTop: '4rem' }}>
                    <Container  className="container-slide-in-left">
                        <CarConfigurator
                            loggedIn={props.loggedIn}
                            models={props.models}
                            accessories={props.accessories}
                            selectedModel={props.selectedModel}
                            selectedAccessories={props.selectedAccessories}
                            setSelectedModel={props.setSelectedModel}
                            setSelectedAccessories={props.setSelectedAccessories}
                            editMode={editMode}
                            newMode={newMode}
                        />
                    </Container>
                    <Container  className="container-slide-in-right">
                        {props.loggedIn && (
                            <Col>
                                <UserConfiguration
                                    user={props.user}
                                    setUser={props.setUser}
                                    authToken={props.authToken}
                                    setAuthToken={props.setAuthToken}
                                    models={props.models}
                                    accessories={props.accessories}
                                    selectedModel={props.selectedModel}
                                    selectedAccessories={props.selectedAccessories}
                                    setSelectedModel={props.setSelectedModel}
                                    setSelectedAccessories={props.setSelectedAccessories}
                                    setCarAccessories={props.setCarAccessories}
                                    editMode={editMode}
                                    setEditMode={setEditMode}
                                    setNewMode={setNewMode}
                                />
                            </Col>
                        )}
                    </Container>
                </Container>
            </Row>
        </>
    )
}

function GenericLayout(props) {
    return (
        <Container data-bs-theme="dark">
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                margin: '0 auto',
                maxWidth: '1000px'
            }}>
                <div>
                    <Row>
                        <Col>
                            <Navigation
                                loggedIn={props.loggedIn}
                                user={props.user}
                                logout={props.logout}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <div style={{paddingTop: '6rem'}}>
                            <CarConfigurator
                                loggedIn={props.loggedIn}
                                models={props.models}
                                accessories={props.accessories}
                                selectedModel={props.selectedModel}
                                selectedAccessories={props.selectedAccessories}
                                setSelectedModel={props.setSelectedModel}
                                setSelectedAccessories={props.setSelectedAccessories}
                            />
                        </div>
                    </Row>
                </div>
            </div>
        </Container>
    );
}

export { LoginLayout, GenericLayout, UserConfigurationLayout, NotFoundLayout }
