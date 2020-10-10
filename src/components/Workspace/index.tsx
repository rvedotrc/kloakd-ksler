import * as React from 'react';

import Welcome from '../Welcome';
import WorkspaceBar, {TabType} from '../WorkspaceBar';
import ImageList from "../ImageList";
import Upload from "../Upload";
import ExifExtraction from "../ExifExtraction";
import Wiring from "../Wiring";

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

    switchTabTo(newTab: TabType) {
        this.setState({ selectedTab: newTab });
    }

    render() {
        const { user } = this.props;
        const { selectedTab } = this.state;

        return (
            <div>
                <WorkspaceBar onSwitchTab={(to: TabType) => {this.switchTabTo(to)}}/>

                <div className="container">
                    {(selectedTab === 'startTab') && (
                        <Welcome/>
                    )}
                    {(selectedTab === 'uploadTab') && (
                        <Upload user={user}/>
                    )}
                    {(selectedTab === 'exifTab') && (
                        <ExifExtraction user={user}/>
                    )}
                    {(selectedTab === 'imageListTab') && (
                        <ImageList user={user}/>
                    )}
                    {(selectedTab === 'wiringTab') && (
                        <Wiring/>
                    )}
                </div>
            </div>
        )
    }
}

export default Workspace;
