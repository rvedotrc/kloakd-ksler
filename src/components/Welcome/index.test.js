import React from 'react';
import renderer from 'react-test-renderer';

import Welcome from './index';

describe(Welcome, () => {

    test('renders', () => {
        // eslint-disable-next-line no-unused-vars
        const component = renderer.create(
            <Welcome/>
        );
    });

});
