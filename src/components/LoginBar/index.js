import React, { Component } from 'react';
import PropTypes from 'prop-types';

class LoginBar extends Component {
    signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithRedirect(provider);
    }

    signOut() {
        firebase.auth().signOut().catch(function(error) {
            // An error happened.
            console.log(error);
        });
    }

    render() {
        const { user } = this.props;

        return (
            <div id={'LoginBar'}>
                {!user && (
                    <span>
                        <button onClick={this.signInWithGoogle}>Log in</button>
                    </span>
                )}
                {user && (
                    <span>
                        <span>
                            Logged in as
                            {' '}
                            <b>{this.props.user.displayName}</b>
                        </span>
                        {' '}
                        <button onClick={this.signOut}>Log out</button>
                    </span>
                )}
            </div>
        )
    }
}

LoginBar.propTypes = {
    user: PropTypes.object
};

LoginBar.defaultProps = {
    user: null
};

export default LoginBar;
