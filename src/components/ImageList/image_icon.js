import React, { Component } from 'react';

import PropTypes from "prop-types";

class ImageIcon extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const entry = this.props.entry;

        try {
            const thumbnailPath = entry.thumbnails['200x200'];
            const fullPath = thumbnailPath || entry.metadata.fullPath;
            const usingThumbnail = !!thumbnailPath;

            const reference = firebase.storage().ref(fullPath);

            reference.getDownloadURL()
                .then(imageDownloadUrl => this.setState({ imageDownloadUrl, usingThumbnail }))
                .catch(error => console.log({error}));
        } catch(e) {
            console.log({ e });
        }
    }

    render() {
        const { imageDownloadUrl, usingThumbnail } = this.state;
        if (!imageDownloadUrl) return "...";

        const style = {};

        if (!usingThumbnail) {
            style.width = '200px';
            style.height = '200px';
            style.border = '1px solid red';
        }

        return (
            <img
                style={style}
                src={imageDownloadUrl}
            />
        );
    }

}

ImageIcon.propTypes = {
    sha: PropTypes.string.isRequired,
    entry: PropTypes.object.isRequired,
};

export default ImageIcon;
