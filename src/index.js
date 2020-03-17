import React from 'react';
import ReactDOM from 'react-dom';

import PageRoot from './components/PageRoot';

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(
        <PageRoot/>,
        document.getElementById("react_container")
    );
});
