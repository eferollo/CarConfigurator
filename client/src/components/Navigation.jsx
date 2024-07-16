import 'bootstrap-icons/font/bootstrap-icons.css'

import {Navbar, Form, Container} from 'react-bootstrap';
import { LoginButton, LogoutButton } from "./Auth";

const Navigation = (props) => {
    return (
        <Navbar data-bs-theme="dark" className="bg-dark shadow" fixed="top" style={{"marginBottom": "2rem"}}>
            <Container>
                <Navbar.Brand>
                    <i className="bi bi-car-front-fill" style={{ fontSize: '1.6rem' }} />
                    <span className="ms-2 fs-4">Car Configurator</span>
                </Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text className="mx-2 fs-5">
                        {props.user && props.user.name && `Logged in as: ${props.user.name}`}
                    </Navbar.Text>
                    <Form className="d-flex">
                        {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
                    </Form>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export { Navigation };
