import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Welcome from '../Welcome';
import WorkspaceBar from '../WorkspaceBar';

class Workspace extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedTab: 'startTab',
        };
    }

    switchTabTo(newTab) {
        this.setState({ selectedTab: newTab });
    }

    render() {
        // const { user } = this.props;
        const { selectedTab } = this.state;

        return (
            <div>
                <WorkspaceBar onSwitchTab={(to) => {this.switchTabTo(to)}}/>

                <div className="container">
                    {(selectedTab === 'startTab') && (
                        <Welcome/>
                    )}
                </div>
            </div>
        )
    }
}

Workspace.propTypes = {
    user: PropTypes.object.isRequired
};

export default Workspace;
