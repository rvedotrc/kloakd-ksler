import React, { Component } from 'react';

import LoginBox from '../LoginBox';
import LoggedInBox from '../LoggedInBox';

class PageRoot extends Component {
    constructor(props) {
        super(props);
        this.state = { loaded: false };
    }

    componentDidMount() {
        firebase.auth().onAuthStateChanged(user => {
            if (this.state.ref) this.state.ref.off();

            this.setState({
                loaded: true,
                user: user,
                ref: null,
            });
        });
    }

    componentWillUnmount() {
        if (this.state.ref) this.state.ref.off();
        firebase.auth().off();
    }

    render() {
        const { loaded, user } = this.state;

        return (
            <div>
                {!loaded ? (
                    <p style={{margin: '1em'}}>Loading...</p>
                ) : user ? (
                    <LoggedInBox user={user}/>
                ) : (
                    <LoginBox/>
                )}
            </div>
        )
    }
}

export default PageRoot;

