import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { GenericLayout, LoginLayout, UserConfigurationLayout, NotFoundLayout } from "./components/Layout";

import API from "./API.js";

function App() {
    return (
        <BrowserRouter>
            <Main />
        </BrowserRouter>
    )
}

function Main() {
    const navigate = useNavigate();

    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(undefined);

    const [carModels, setCarModels] = useState([]);
    const [carAccessories, setCarAccessories] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedAccessories, setSelectedAccessories] = useState([]);

    const renewToken = () => {
        return API.getAuthToken()
            .then((res) => { setAuthToken(res.token); })
            .catch((err) => { console.log('FAIL: renewToken error: ', err) });
    }

    useEffect(() => {
        const checkAuth = async() => {
            try {
                const user = await API.getUserInfo();
                setUser(user);
                API.getAuthToken().then((res) => { setAuthToken(res.token); });
                setLoggedIn(true);
            } catch (err) {

            }
        };
        checkAuth();
    }, []);

    /* Function to handle the login process */
    const handleLogin = async (credentials) => {
        try {
            const user = await API.logIn(credentials);
            setUser(user);
            await renewToken();
            setLoggedIn(true);
        } catch (err) {
            throw err;
        }
    };

    /* Function to handle the logout process */
    const handleLogout = async () => {
        await API.logOut();
        setLoggedIn(false);
        setUser(null);
        setAuthToken(undefined);
        navigate("/");
    };

    /* Load the car models and accessories */
    useEffect(() => {
        const loadModels = async() => {
            try {
                const models = await API.fetchCarModels();
                setCarModels(models);
            } catch (err) {
                throw err;
            }
        }

        const loadAccessories = async() => {
            try {
                const accessories = await API.fetchCarAccessories();
                setCarAccessories(accessories);
            } catch (err) {
                throw err;
            }
        }
        loadModels();
        loadAccessories();
    }, [loggedIn, user]);

    return (
        <Container fluid>
            <Routes>
                <Route
                    path="/"
                    element={loggedIn ?
                        <Navigate to="/user/configuration" /> :
                        <GenericLayout
                            loggedIn={loggedIn}
                            user={user}
                            logout={handleLogout}
                            models={carModels}
                            accessories={carAccessories}
                            selectedModel={selectedModel}
                            selectedAccessories={selectedAccessories}
                            setSelectedModel={setSelectedModel}
                            setSelectedAccessories={setSelectedAccessories}
                        />}
                />
                <Route
                    path="/user/configuration"
                    element={loggedIn ?
                        <UserConfigurationLayout
                            loggedIn={loggedIn}
                            user={user}
                            logout={handleLogout}
                            models={carModels}
                            accessories={carAccessories}
                            selectedModel={selectedModel}
                            selectedAccessories={selectedAccessories}
                            setSelectedModel={setSelectedModel}
                            setSelectedAccessories={setSelectedAccessories}
                            setUser={setUser}
                            setCarAccessories={setCarAccessories}
                            authToken={authToken}
                            setAuthToken={setAuthToken}
                        /> : <Navigate replace to='/login' />}
                />
                <Route
                    path="/login"
                    element={!loggedIn ?
                        <LoginLayout login={handleLogin} /> :
                        <Navigate replace to='/user/configuration' />}
                />
                <Route path="*" element={<NotFoundLayout />} />
            </Routes>
        </Container>
    );
}

export default App;
