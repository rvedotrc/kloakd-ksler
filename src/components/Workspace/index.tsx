import * as React from 'react';

import Welcome from '../Welcome';
import WorkspaceBar from '../WorkspaceBar';
import ImageList from "../ImageList";
import Upload from "../Upload";

declare const firebase: typeof import('firebase');

type Props = {
    user: firebase.User;
};

type State = {
    selectedTab: string;
};

class Workspace extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            selectedTab: 'startTab',
        };
    }

    switchTabTo(newTab: string) {
        this.setState({ selectedTab: newTab });
    }

    render() {
        const { user } = this.props;
        const { selectedTab } = this.state;

        return (
            <div>
                <WorkspaceBar onSwitchTab={(to) => {this.switchTabTo(to)}}/>

                <div className="container">
                    {(selectedTab === 'startTab') && (
                        <Welcome/>
                    )}
                    {(selectedTab === 'uploadTab') && (
                        <Upload user={user}/>
                    )}
                    {(selectedTab === 'imageListTab') && (
                        <ImageList user={user}/>
                    )}
                </div>
            </div>
        )
    }
}

export default Workspace;
