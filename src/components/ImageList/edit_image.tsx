import * as React from 'react';
import {DBEntry, ImageFileGroup} from "../../types";
import ImageLoader from "./image_loader";

declare const firebase: typeof import('firebase');

type Props = {
    user: firebase.User;
    sha: string;
    entry: ImageFileGroup;
    dbEntry: DBEntry;
    onDelete: (sha: string) => void;
    onClose: () => void;
};

type State = {
    textValue: string;
    tagsValue: string;
    dbEntry: DBEntry;
};

class EditImage extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            textValue: this.props.dbEntry.text,
            tagsValue: this.props.dbEntry.tags.sort().join(" "),
            dbEntry: this.props.dbEntry,
        };
    }

    resetRotation() {
        this.setState({
            dbEntry: {
                ...this.state.dbEntry,
                rotateDegrees: 0,
            },
        });
    }

    onSubmit() {
        firebase.database().ref(`users/${this.props.user.uid}/images/${this.props.sha}`)
            .set(this.state.dbEntry)
            .then(() => this.props.onClose())
            .catch(err => console.error("Error saving image data to db:", err));
    }

    onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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

        const rotate = (by: number) => {
            let rotateDegrees = this.state.dbEntry.rotateDegrees;
            rotateDegrees = Math.floor(rotateDegrees + 360 + by) % 360;
            this.setState({
                dbEntry: {
                    ...this.state.dbEntry,
                    rotateDegrees,
                },
            });
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
            Array.from(thumbnails.values()).map(thumbnail =>
                firebase.storage().ref(thumbnail.path).delete()
            )
        ).then(() => {
            const path = this.props.entry.main?.metadata?.fullPath;
            if (path) return firebase.storage().ref(path).delete();
        }).then(() => {
            return firebase.database().ref(`users/${this.props.user.uid}/images/${this.props.sha}`).remove();
        }).then(() => {
            this.props.onDelete(this.props.sha);
            this.props.onClose();
        });
    }

    onFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
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
        if (!this.state) return null;

        const { dbEntry } = this.state;
        if (!dbEntry) return null;

        const transform = `rotate(${1 * (dbEntry.rotateDegrees)}deg)`;

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
                                    tagsValue.toLowerCase().match(/[\wæøå:]+/g) || []
                                )
                                    .filter(t => t.length > 0)
                                    .sort();
                                this.setState({
                                    tagsValue,
                                    dbEntry: {
                                        ...this.state.dbEntry,
                                        tags: tagsArray,
                                    },
                                });
                            }}
                        />
                        <code style={{marginLeft: '1em'}}>
                            {JSON.stringify(this.state.dbEntry.tags)}
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

                <ImageLoader
                    sha={this.props.sha}
                    entry={this.props.entry}
                    preferredThumbnail={"1000x1000"}
                    render={({ src, widthAndHeight }) => {
                        if (!src) return null;

                        return (
                            <div style={{overflow: 'hidden'}}>
                                <img
                                    src={src}
                                    style={{
                                        transform: transform,
                                    }}
                                />
                            </div>
                        );
                    }}
                />

                <hr/>

                <pre>{JSON.stringify(this.props.entry, null, 2)}</pre>
                <pre>{JSON.stringify(Array.from(this.props.entry.thumbnails.keys()).sort())}</pre>
            </div>
        );
    }

}

export default EditImage;
