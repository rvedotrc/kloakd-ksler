import React, { Component } from 'react';

import PropTypes from "prop-types";

class EditImage extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const entry = this.props.entry;

        try {
            const fullPath = entry.thumbnails['1000x1000'] || entry.metadata.fullPath;
            const reference = firebase.storage().ref(fullPath);

            reference.getDownloadURL()
                .then(url => this.setState({imageDownloadUrl: url}))
                .catch(error => console.log({error}));
        } catch(e) {
            console.log({ e });
        }
    }

    reset() {
        this.setState({ rotateDegrees: 0 });
    }

    saveAndClose() {
        const rotateDegrees = this.state.rotateDegrees || 0;
        console.log("TODO: save params for", this.props.sha, "as", { rotateDegrees });
        this.props.onClose();
    }

    onKeyDown(e) {
        // console.log({
        //     key: e.key,
        //     shiftKey: e.shiftKey,
        //     ctrlKey: e.ctrlKey,
        //     altKey: e.altKey,
        //     metaKey: e.metaKey,
        // });

        const getModifiers = () => [
            (e.shiftKey ? 'S' : ''),
            (e.ctrlKey ? 'C' : ''),
            (e.altKey ? 'A' : ''),
            (e.metaKey ? 'M' : ''),
        ].filter(e => e).join("");

        const rotate = by => {
            let rotateDegrees = this.state.rotateDegrees || 0;
            rotateDegrees = Math.floor(rotateDegrees + 360 + by) % 360;
            this.setState({ rotateDegrees });
            e.stopPropagation();
        };

        switch (e.key + ":" + getModifiers()) {
            case 'Escape:':
                this.props.onClose();
                break;
            case '0:':
                this.reset();
                break;
            case 'ArrowLeft:': rotate(-10); break;
            case 'ArrowLeft:S': rotate(-90); break;
            case 'ArrowLeft:A': rotate(-1); break;
            case 'ArrowRight:': rotate(+10); break;
            case 'ArrowRight:S': rotate(+90); break;
            case 'ArrowRight:A': rotate(+1); break;
            case 'Enter:':
                this.saveAndClose();
                break;
        }
    }

    confirmThenDelete() {
        if (!window.confirm("Are you sure you want to delete this image?")) return;

        const thumbnails = this.props.entry.thumbnails;

        Promise.all(
            Object.values(thumbnails).map(fullPath =>
                firebase.storage().ref(fullPath).delete()
            )
        ).then(() => {
            firebase.storage().ref(this.props.entry.metadata.fullPath).delete()
        }).then(() => {
            this.props.onDelete(this.props.sha);
            this.props.onClose();
        });
    }

    render() {
        const { imageDownloadUrl, rotateDegrees } = this.state;
        if (!imageDownloadUrl) return null;

        const transform = `rotate(${1 * (rotateDegrees || 0)}deg)`;

        return (
            <div>
                <p>{this.props.sha}</p>
                <p>
                    <button onClick={this.props.onClose}>Close</button>
                    <button onClick={() => this.confirmThenDelete()} className="danger">Delete</button>
                </p>
                <p>{transform}</p>
                <p>
                    <button
                        autoFocus={true}
                        onKeyDown={e => this.onKeyDown(e)}
                    >Twiddle</button></p>
                <div style={{overflow: 'hidden'}}>
                    <img
                        src={imageDownloadUrl}
                        style={{
                            transform: transform,
                        }}
                    />
                </div>
                <hr/>
                <pre>{JSON.stringify(this.props.entry, null, 2)}</pre>
            </div>
        );
    }

}

EditImage.propTypes = {
    sha: PropTypes.string.isRequired,
    entry: PropTypes.object.isRequired,
    onDelete: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default EditImage;
