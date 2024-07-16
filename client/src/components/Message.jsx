import React, { useEffect } from "react";
import { Alert } from "react-bootstrap";

function DisplayMessage(props) {
    const {
        errorMessage,
        setErrorMessage,
        warningMessage,
        setWarningMessage,
        successMessage,
        setSuccessMessage
    } = props;

    useEffect(() => {
        let timer;
        /* Separate for the auth-login */
        if (errorMessage) {
            timer = setTimeout(() => {
                setErrorMessage('');
            }, 4000);
        }
        if (warningMessage || successMessage) {
            timer = setTimeout(() => {
                setWarningMessage('');
                setSuccessMessage('');
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [errorMessage, warningMessage, successMessage]);

    return (
        <div className="alert-container">
            {errorMessage && (
                <Alert
                    variant="danger"
                    onClose={() => setErrorMessage('')}
                    dismissible
                    className="slide-in-right"
                >
                    <strong>{errorMessage}</strong>
                </Alert>
            )}
            {warningMessage && (
                <Alert
                    variant="warning"
                    onClose={() => setWarningMessage('')}
                    dismissible
                    className="slide-in-right"
                >
                    <strong>{warningMessage}</strong>
                </Alert>
            )}
            {successMessage && (
                <Alert
                    variant="success"
                    onClose={() => setSuccessMessage('')}
                    dismissible
                    className="slide-in-right"
                >
                    <strong>{successMessage}</strong>
                </Alert>
            )}
        </div>
    );
}

export { DisplayMessage }