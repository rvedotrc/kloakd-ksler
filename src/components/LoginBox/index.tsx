import * as React from 'react';

import LoginBar from '../LoginBar';
import Welcome from '../Welcome';

class LoginBox extends React.Component<{}, never> {
    render() {
        return (
            <div>
                <LoginBar/>
                <div className="container">
                    <Welcome/>
                </div>
            </div>
        )
    }
}

export default LoginBox;
