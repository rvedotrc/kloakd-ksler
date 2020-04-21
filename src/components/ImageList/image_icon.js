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

        const transform = `rotate(${1 * (this.props.dbData.rotateDegrees || 0)}deg)`;
        const style = { transform };

        if (!usingThumbnail) {
            style.width = '200px';
            style.height = '200px';
            style.border = '1px solid red';
        }

        return (
            <div>
                <p className="imageText">{this.props.dbData.text || ''}</p>
                <p className="imageTags">{(this.props.dbData.tags || []).join(' ')}</p>
                {/*<code>{JSON.stringify(this.props.dbData)}</code>*/}
                <img style={style} src={imageDownloadUrl}/>
            </div>
        );
    }

}

ImageIcon.propTypes = {
    sha: PropTypes.string.isRequired,
    entry: PropTypes.object.isRequired,
    dbData: PropTypes.object.isRequired,
};

export default ImageIcon;
