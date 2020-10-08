import * as React from 'react';

import LoginBox from '../LoginBox';
import LoggedInBox from '../LoggedInBox';

declare const firebase: typeof import('firebase');

type State = {
    loaded: boolean;
    user: firebase.User | null;
    unsubscribe?: firebase.Unsubscribe;
};

class PageRoot extends React.Component<any, State> {
    constructor(props: any) {
        super(props);
        this.state = { loaded: false, user: null };
    }

    componentDidMount() {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            this.setState({
                loaded: true,
                user: user,
            });
        });

        this.setState({ unsubscribe });
    }

    componentWillUnmount() {
        this.state?.unsubscribe?.();
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
