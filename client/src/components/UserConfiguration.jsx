import React, { useEffect, useState } from "react";
import { Button, Col, Modal, Row, Table, Card, Badge } from "react-bootstrap";
import API from "../API.js";
import { DisplayMessage } from "./Message";

function UserConfiguration(props) {
    const {
        models,
        accessories,
        user,
        selectedModel,
        selectedAccessories,
        setSelectedModel,
        setSelectedAccessories,
        editMode,
        setEditMode,
        setUser,
        setCarAccessories,
        setNewMode,
        authToken,
        setAuthToken
    } = props;

    const [userConfiguration, setUserConfiguration] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [estimationTime, setEstimationTime] = useState(0);
    const [outOfStock, setOutOfStock] = useState([]);

    useEffect(() => {
        setTimeout(() => setSuccessMessage(`Hi, welcome back ${user.name}!`), 300);
    }, []);

    /* Load user configuration at first mount and every time the user properties are updated.
     * Every time fetch from server2 the estimation time based on the user configuration accessories */
    useEffect(() => {
        const loadConf = async () => {
            try {
                if (user.hasCarConfiguration) {
                    setEditMode(false);
                    setNewMode(false);
                    const carConfig = await API.getUserCarConfiguration();
                    setUserConfiguration(carConfig);
                    setSelectedModel(carConfig.carModelId);
                    setSelectedAccessories(carConfig.accessoryIds || []);
                    await requestEstimationTime(carConfig.accessoryIds);
                } else {
                    setSelectedModel(null);
                    setSelectedAccessories([]);
                    setEstimationTime(0);
                }
            } catch (err) {
                setErrorMessage("Failed to load user configuration");
            }
        };
        loadConf();
    }, [user]);

    /* Helper function for mapping every user configuration accessories id with their name and
     * fetching the estimation time from server2 according to the validity of the token.
     * The token is renewed if expired (error from the response). */
    const requestEstimationTime = async (accessoryIds) => {
        if (authToken && Array.isArray(accessoryIds)) {
            const accessoryNames = accessoryIds.map(id => {
                const accessory = accessories.find(a => a.id === id);
                return accessory ? accessory.name : null;
            }).filter(name => name !== null);

            try {
                const time = await API.getEstimationTime(authToken, accessoryNames);
                setEstimationTime(time.days);
            } catch (err) {
                setEstimationTime(0);
                try {
                    const res = await API.getAuthToken();
                    setAuthToken(res.token);
                    const newTime = await API.getEstimationTime(res.token, accessoryNames);
                    setEstimationTime(newTime.days);
                } catch (error) {
                    setErrorMessage("Failed to fetch estimation time");
                }
            }
        }
    };

    /* Helper function for saving the user configuration (updated or fresh new).
     * After saving, the user.hasCarConfiguration is updated eben if already set to true, therefore triggering the
     * useEffect (loadConf). The accessories are fetched again from the server to show the new availability */
    const handleSaveConfiguration = async () => {
        if (!selectedModel) {
            setWarningMessage("Please select a car model");
            return;
        }

        try {
            const newConfiguration = {
                carModelId: selectedModel,
                accessories: selectedAccessories,
            };

            if (editMode && userConfiguration) {
                const response = await API.updateUserCarConfiguration(newConfiguration);
                if (!response.error) {
                    setSuccessMessage("Configuration updated successfully");
                }
            } else {
                const response = await API.saveUserCarConfiguration(newConfiguration);
                if (!response.error) {
                    setSuccessMessage("Configuration saved successfully");
                }
            }

            const updatedUser = {
                ...user,
                hasCarConfiguration: true
            };
            setUser(updatedUser);
            const updatedAccessories = await API.fetchCarAccessories();
            setCarAccessories(updatedAccessories);
        } catch (err) {
            setErrorMessage("Failed to save user configuration.");
            if (userConfiguration === null) {
                setSelectedAccessories([]);
            } else {
                setSelectedAccessories(userConfiguration.accessoryIds);
            }
        }
    };

    /* Helper function for deleting a user configuration. Similar behavior of saving function */
    const handleDeleteConfiguration = async () => {
        try {
            await API.deleteUserCarConfiguration();
            setUserConfiguration(null);
            setShowDeleteModal(false);

            const updatedUser = {
                ...user,
                hasCarConfiguration: false
            };
            setUser(updatedUser);
            const updatedAccessories = await API.fetchCarAccessories();
            setCarAccessories(updatedAccessories);
            setSuccessMessage("Configuration deleted successfully");
        } catch (err) {
            setErrorMessage("Failed to delete user configuration");
        }
    };

    /* Helper function for handling the cancel button when editing a configuration (or creating a new one).
     * It resets the states and handle the availability going to 0 again (only visually) when it has
     * been incremented of 1 (always visually), for enabling the select button, after deleting the accessory */
    const handleCancelEditConfiguration = () => {
        setEditMode(false);
        setNewMode(false);
        if (userConfiguration === null) {
            setSelectedModel(null);
            setSelectedAccessories([]);
        } else {
            outOfStock.forEach(e => e.availability -= 1);
            setOutOfStock([]);
            setSelectedAccessories(userConfiguration.accessoryIds);
        }
    };

    /* Helper function for handling the delete button and check the constraints of the accessories being deleted.
     * When an accessory has 0 availability and already present in the user configuration then, when removed, its
     * availability is increased of 1 (only visually) for enabling the select button again and allow to revert it. */
    const handleDeleteButton = (accessory, accessoryId) => {
        const dependencies = accessories.filter(a => a.requiredAccessoryId === accessoryId);
        const canRemove = dependencies.every(dep => !selectedAccessories.includes(dep.id));
        if (!canRemove) {
            setWarningMessage(
                `Cannot remove ${accessory.name} because it is required by ${dependencies.map(e => e.name)}`
            );
        } else {
            if (accessory.availability === 0) {
                accessory.availability += 1;
                const shortage = [...outOfStock, accessory];
                setOutOfStock(shortage);
            }
            setSelectedAccessories(selectedAccessories.filter(id => id !== accessoryId));
        }
    }

    /* Helper function for handling the reset button. The selected accessories are wiped and same approach as
     * handleDeleteButton for 0 availability accessories */
    const handleResetButton = () => {
        accessories.map(accessory => {
            if (accessory.availability === 0) {
                accessory.availability += 1;
                const shortage = [...outOfStock, accessory];
                setOutOfStock(shortage);
            }
        });
        setSelectedAccessories([]);
    }

    /* Helper function for disabling the save button when nothing has been changed from the initial configuration */
    const isSaveDisabled = () => {
        if (userConfiguration !== null) {
            return selectedAccessories.length === userConfiguration.accessoryIds.length &&
                selectedAccessories.every(id => userConfiguration.accessoryIds.includes(id))
        }
    }

    const toggleDeleteModal = () => {
        setShowDeleteModal(!showDeleteModal);
    };

    const getModelName = () => {
        const model = models.find((e, index) => index + 1 === selectedModel);
        return model ? model.model : "No model selected";
    };

    const getModelBasePrice = () => {
        const model = models.find((e, index) => index + 1 === selectedModel);
        return model ? model.cost : 0;
    };

    const calculateTotalPrice = () => {
        if (selectedModel === null || selectedModel === undefined) {
            return 0;
        }
        const model = models.find((e, index) => index + 1 === selectedModel);

        const accessoriesPrice = selectedAccessories.reduce((sum, id) => {
            const accessory = accessories.find((a) => a.id === id);
            return sum + (accessory ? accessory.price : 0);
        }, 0);

        return model.cost + accessoriesPrice;
    };

    return (
        <Col>
            <h2 className="mb-4">Your Configuration</h2>

            {!editMode && !userConfiguration ? (
                <Card className="mb-4">
                    <Card.Body>
                        <Card.Title>No Configuration Found</Card.Title>
                        <p>You don't have a car configuration. Please add a new configuration.</p>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Selected Model</Card.Title>
                            <h3 className="mb-3">{getModelName()}</h3>
                            <h6 className="align-self-lg-end">Base Price: {getModelBasePrice()}€</h6>
                            {selectedAccessories.length !== models[selectedModel - 1]?.maxAccessories ? (
                                <Badge pill bg="success" style={{fontSize: '0.9rem'}}>
                                    {selectedAccessories.length} Accessories selected
                                </Badge>
                            ) : (
                                <Badge pill bg="danger" style={{fontSize: '0.9rem'}}>
                                    {selectedAccessories.length} Accessories selected
                                </Badge>
                            )}
                            <div className="position-absolute bottom-0 end-0 m-3">
                                <Badge pill bg="success" style={{fontSize: '0.9rem'}}>
                                    Estimated delivery time: {estimationTime} days
                                </Badge>
                            </div>
                        </Card.Body>
                    </Card>

                    <Table striped bordered>
                        <thead>
                        <tr>
                            <th style={{width: '50%'}}>Accessories</th>
                            <th style={{width: '35%'}}>Price</th>
                            <th style={{width: '15%'}}>{"Actions"}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {selectedAccessories.map(accessoryId => {
                            const accessory = accessories.find(a => a.id === accessoryId);
                            if (!accessory) return null;
                            return (
                                <tr key={accessoryId}>
                                    <td>{accessory.name}</td>
                                    <td>{accessory.price}€</td>
                                    <td>
                                        {(
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                disabled={!editMode}
                                                onClick={() => handleDeleteButton(accessory, accessoryId)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </Table>
                </>
            )}

            {(editMode !== null || userConfiguration !== null) && (
                <h3 className="align-content-end">Total price: {calculateTotalPrice()}€</h3>
            )}

            <Row className="mb-3">
                <Col className="text-end">
                    {!editMode && !userConfiguration ? (
                        <Button
                            variant="primary"
                            className="custom-button me-2"
                            onClick={() => {
                                setEditMode(true);
                                setNewMode(true);
                            }}
                        >
                            Add New Configuration
                        </Button>
                    ) : (
                        <>
                            {!editMode && (
                                <>
                                    <Button variant="primary"
                                            className="custom-button me-2"
                                            onClick={() => setEditMode(true)}
                                    >
                                        Edit Configuration
                                    </Button>
                                    <Button variant="danger"
                                            className="custom-button me-2"
                                            onClick={toggleDeleteModal}
                                    >
                                        Delete Configuration
                                    </Button>
                                </>
                            )}
                            {editMode && (
                                <>
                                    <Button variant="success" className="custom-button me-2"
                                            onClick={handleSaveConfiguration}
                                            disabled={isSaveDisabled()}
                                    >
                                        Save
                                    </Button>
                                    <Button className="custom-button me-2"
                                            variant="danger"
                                            onClick={handleResetButton}>
                                        Reset
                                    </Button>
                                    <Button className="custom-button"
                                            variant="secondary"
                                            onClick={() => handleCancelEditConfiguration()}>
                                        Cancel
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </Col>
            </Row>

            {userConfiguration !== null && (
                <Modal show={showDeleteModal} onHide={toggleDeleteModal} backdrop="static" keyboard={false} data-bs-theme="dark">
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Deletion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Are you sure you want to delete your car configuration? This action cannot be undone.
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="custom-button" variant="secondary" onClick={toggleDeleteModal}>
                            Cancel
                        </Button>
                        <Button className="custom-button" variant="danger" onClick={handleDeleteConfiguration}>
                            Delete
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}

            <DisplayMessage
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
                warningMessage={warningMessage}
                setWarningMessage={setWarningMessage}
                successMessage={successMessage}
                setSuccessMessage={setSuccessMessage}
            />
        </Col>
    );
}

export { UserConfiguration };
