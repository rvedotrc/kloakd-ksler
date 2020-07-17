import * as React from 'react';

import Workspace from '../Workspace';
import LoginBar from '../LoginBar';

declare const firebase: typeof import('firebase');

type Props = {
    user: firebase.User;
};

class LoggedInBox extends React.Component<Props, never> {
    render() {
        return (
            <div>
                <LoginBar user={this.props.user}/>
                <Workspace user={this.props.user}/>
            </div>
        )
    }
}

export default LoggedInBox;
