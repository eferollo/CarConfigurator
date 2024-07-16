import React, { useEffect } from 'react';
import { Badge, Button, Card, Col, Row, OverlayTrigger, Tooltip } from 'react-bootstrap';

function CarConfigurator(props) {
    const {
        models,
        accessories,
        loggedIn,
        selectedModel,
        selectedAccessories,
        setSelectedModel,
        setSelectedAccessories,
        editMode,
        newMode,
    } = props;

    /* Reset selectedModel and selectedAccessories when logged out */
    useEffect(() => {
        if (!loggedIn) {
            setSelectedModel(null);
            setSelectedAccessories([]);
        }
    }, [loggedIn]);

    /* Function to check if the selected accessory meets the constraints */
    const checkConstraints = (id) => {
        const accessory = accessories.find(a => a.id === id);
        if (!accessory) {
            return false;
        }

        if (accessory.requiredAccessoryId && !selectedAccessories.includes(accessory.requiredAccessoryId)) {
            return false;
        } else if (accessory.incompatibleAccessoryId && selectedAccessories.includes(accessory.incompatibleAccessoryId)) {
            return false;
        }
        return true;
    };

    /* Function to validate the selected accessories.
     * Even with a disabled button it makes more robust to unwanted behaviours */
    const handleSelectAccessory = (id) => {
        if (selectedModel === null) {
            return;
        }
        const canSelect = checkConstraints(id);
        if (canSelect) {
            if (selectedAccessories.includes(id)) {
                setSelectedAccessories(selectedAccessories.filter(a => a !== id));
            } else if (selectedAccessories.length < models[selectedModel - 1]?.maxAccessories) {
                setSelectedAccessories([...selectedAccessories, id]);
            }
        }
    };

    const getBadgeVariant = (availability) => {
        return availability > 0 ? 'success' : 'danger';
    };

    /* Function to render the tooltip for accessories that have some constraints */
    const renderTooltip = (accessory) => {
        let tooltipContent = '';

        if (accessory.requiredAccessoryId) {
            const requiredAccessory = accessories.find(a => a.id === accessory.requiredAccessoryId);
            tooltipContent += `Requires: ${requiredAccessory.name}`;
        }

        if (accessory.incompatibleAccessoryId) {
            const incompatibleAccessory = accessories.find(a => a.id === accessory.incompatibleAccessoryId);
            if (tooltipContent !== '') {
                tooltipContent += '\n';
            }
            tooltipContent += `Incompatible with: ${incompatibleAccessory.name}`;
        }

        return (
            <Tooltip id={`tooltip-${accessory.id}`}>
                <span>{tooltipContent}</span>
            </Tooltip>
        );
    };

    return (
        <Col>
            <h2 className="mb-4 text-center">Car Models</h2>
            <Row xs={1} md={2} lg={3} className="align-self-lg-auto">
                {models.map((carModel, index) => (
                    <Col key={index} className="mb-3">
                        <Card
                            className={selectedModel === carModel.id ? 'border-success' : 'border-secondary'}
                            style={{ width: '100%' }}
                        >
                            <Card.Body>
                                <Card.Title>{carModel.model}</Card.Title>
                                <Card.Text>
                                    <strong>Engine Power:</strong> {carModel.enginePower}KW<br/>
                                    <strong>Cost:</strong> {carModel.cost}€<br/>
                                    <strong>Max accessories:</strong> {carModel.maxAccessories}<br/>
                                </Card.Text>
                                {loggedIn ? (
                                    selectedModel !== carModel.id && (
                                        <Button
                                            onClick={() => setSelectedModel(carModel.id)}
                                            className="custom-button position-absolute bottom-0 end-0 m-3"
                                            disabled={!newMode || !editMode || selectedAccessories.length > carModel.maxAccessories}
                                        >
                                            Select
                                        </Button>
                                    )
                                ) : (
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id={`tooltip-${carModel.model}`}>Log in to select</Tooltip>}
                                    >
                                        <div
                                            className="position-absolute bottom-0 end-0 m-3"
                                            style={{ cursor: 'not-allowed' }}
                                        >
                                            <Button
                                                variant='primary'
                                                className="custom-button"
                                                disabled
                                            >
                                                Select
                                            </Button>
                                        </div>
                                    </OverlayTrigger>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <h2 className="mt-5 mb-4 text-center">Accessories</h2>
            <Row xs={1} md={2} lg={3} className="align-self-lg-auto">
                {accessories.map((accessory) => (
                    <Col key={accessory.id} className="mb-3">
                        <Card
                            className={selectedAccessories.includes(accessory.id) ? 'border-success' : 'border-secondary'}
                            style={{ width: '100%' }}
                        >
                            <Card.Body>
                                <Card.Title>
                                    {accessory.name}
                                    {(accessory.requiredAccessoryId || accessory.incompatibleAccessoryId) && (
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip(accessory)}
                                        >
                                            <span className="ms-2 text-warning-emphasis">
                                                <i className="bi bi-info-circle"></i>
                                            </span>
                                        </OverlayTrigger>
                                    )}
                                </Card.Title>
                                <Card.Text>
                                    <strong>Price:</strong> {accessory.price}€<br />
                                    <strong>Availability:</strong>{' '}
                                    <Badge bg={getBadgeVariant(accessory.availability)}>
                                        {accessory.availability}
                                    </Badge>
                                    <br />
                                </Card.Text>
                                {loggedIn ? (
                                    selectedAccessories.includes(accessory.id) ? null : (
                                        <Button
                                            variant='primary'
                                            onClick={() => handleSelectAccessory(accessory.id)}
                                            className="custom-button position-absolute bottom-0 end-0 m-3"
                                            disabled={
                                                selectedModel === null ||
                                                selectedAccessories.length >= models[selectedModel-1]?.maxAccessories ||
                                                !checkConstraints(accessory.id) || !editMode || accessory.availability === 0
                                            }
                                        >
                                            Select
                                        </Button>
                                    )
                                ) : (
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id={`tooltip-${accessory.name}`}>Log in to select</Tooltip>}
                                    >
                                        <div
                                            className="position-absolute bottom-0 end-0 m-3"
                                            style={{ cursor: 'not-allowed' }}
                                        >
                                            <Button
                                                className="custom-button"
                                                variant='primary'
                                                disabled
                                            >
                                                Select
                                            </Button>
                                        </div>
                                    </OverlayTrigger>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Col>
    );
}

export { CarConfigurator };
