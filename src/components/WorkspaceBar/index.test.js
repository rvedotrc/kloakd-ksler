import React from 'react';
import {mount} from 'enzyme';

import WorkspaceBar from './index';

describe(WorkspaceBar, () => {

    test('renders', () => {
        const onSwitch = () => {};

        const wrapper = mount(
            <WorkspaceBar onSwitchTab={onSwitch}/>
        );

        expect(wrapper.find('button')).toHaveLength(1);
    });

});
