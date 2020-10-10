import * as React from 'react';
import * as ReactDOM from 'react-dom';

import PageRoot from './components/PageRoot';
import * as Wiring from './lib/wiring';

document.addEventListener('DOMContentLoaded', () => {
    Wiring.start();
    ReactDOM.render(
        React.createElement(PageRoot),
        document.getElementById("react_container")
    );
});
