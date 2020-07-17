import * as React from 'react';

declare const firebase: typeof import('firebase');

type Props = {
    user?: firebase.User;
};

class LoginBar extends React.Component<Props, never> {
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
                            <b>{user.displayName}</b>
                        </span>
                        {' '}
                        <button onClick={this.signOut}>Log out</button>
                    </span>
                )}
            </div>
        )
    }
}

export default LoginBar;
