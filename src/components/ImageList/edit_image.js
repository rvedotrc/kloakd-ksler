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

        const ref = firebase.database().ref(`users/${this.props.user.uid}/images/${this.props.sha}`);

        ref.once('value', snapshot => {
            const dbData = snapshot.val() || {};
            const textValue = dbData.text || '';
            const tagsArray = dbData.tags || [];
            const tagsValue = tagsArray.sort().join(' ');
            const rotateDegrees = dbData.rotateDegrees || 0;
            this.setState({ dbData, textValue, tagsValue, tagsArray, rotateDegrees });
        });
    }

    resetRotation() {
        this.setState({ rotateDegrees: 0 });
    }

    onSubmit() {
        const { textValue, tagsArray, rotateDegrees } = this.state;
        if (typeof(textValue) !== 'string' || !tagsArray || typeof(rotateDegrees) !== 'number') return;

        firebase.database().ref(`users/${this.props.user.uid}/images/${this.props.sha}`)
            .set({
                text: textValue,
                tags: tagsArray,
                rotateDegrees: rotateDegrees,
            })
            .then(() => this.props.onClose())
            .catch(err => console.error("Error saving image data to db:", err));
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
            case '0:':
                this.resetRotation();
                break;
            case 'ArrowLeft:': rotate(-10); break;
            case 'ArrowLeft:S': rotate(-90); break;
            case 'ArrowLeft:A': rotate(-1); break;
            case 'ArrowRight:': rotate(+10); break;
            case 'ArrowRight:S': rotate(+90); break;
            case 'ArrowRight:A': rotate(+1); break;
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
            return firebase.storage().ref(this.props.entry.metadata.fullPath).delete();
        }).then(() => {
            return firebase.database().ref(`users/${this.props.user.uid}/images/${this.props.sha}`).delete();
        }).then(() => {
            this.props.onDelete(this.props.sha);
            this.props.onClose();
        });
    }

    onFormKeyDown(e) {
        const getModifiers = () => [
            (e.shiftKey ? 'S' : ''),
            (e.ctrlKey ? 'C' : ''),
            (e.altKey ? 'A' : ''),
            (e.metaKey ? 'M' : ''),
        ].filter(e => e).join("");

        switch (e.key + ":" + getModifiers()) {
            case 'Escape:':
                e.preventDefault();
                this.props.onClose();
                break;
            case 'Enter:':
                e.preventDefault();
                this.onSubmit();
                break;
        }
    }

    render() {
        const { imageDownloadUrl, rotateDegrees, dbData } = this.state;
        if (!imageDownloadUrl) return null;
        if (!dbData) return null;

        const transform = `rotate(${1 * (rotateDegrees || 0)}deg)`;

        return (
            <div>
                <form
                    onSubmit={(e) => { e.preventDefault();this.onSubmit(); }}
                    onReset={this.props.onClose}
                    onKeyDown={e => this.onFormKeyDown(e)}
                    >

                    <p>
                        Text:
                        {' '}
                        <input
                            type="text"
                            size={50}
                            value={this.state.textValue}
                            onChange={e => this.setState({ textValue: e.target.value })}
                            autoFocus={true}
                        />
                        <span style={{marginLeft: '1em'}}>
                            (text that is actually part of the design)
                        </span>
                    </p>

                    <p>
                        Tags:
                        {' '}
                        <input
                            type="text"
                            size={50}
                            value={this.state.tagsValue}
                            onChange={e => {
                                const tagsValue = e.target.value;
                                const tagsArray = Array.from(
                                        tagsValue.toLowerCase().matchAll(/[\wæøå:]+/g)
                                    )
                                    .map(v => v[0])
                                    .filter(t => t.length > 0)
                                    .sort();
                                this.setState({ tagsValue, tagsArray });
                            }}
                        />
                        <code style={{marginLeft: '1em'}}>
                            {JSON.stringify(this.state.tagsArray)}
                        </code>
                    </p>

                    <p>
                        <input type="button" value="Rotate" onKeyDown={e => this.onKeyDown(e)}/>
                        <input type="submit" value="Save"/>
                        <input type="reset" value="Cancel"/>
                        <input type="button" value="Delete" onClick={() => this.confirmThenDelete()} className="danger"/>
                    </p>

                </form>

                <p>{transform}</p>

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
    user: PropTypes.object.isRequired,
    sha: PropTypes.string.isRequired,
    entry: PropTypes.object.isRequired,
    onDelete: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default EditImage;
