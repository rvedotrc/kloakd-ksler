import * as React from 'react';
import {DBEntry, ImageFileGroup} from "lib/types";
import ImageLoader from "./image_loader";
import ImageWithGeometry from "./image_with_geometry";
import {currentExifDbEntries} from "lib/app_context";
import * as Geo from "lib/geo";

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
    imageKey: number;
};

class EditImage extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            textValue: this.props.dbEntry.text,
            tagsValue: this.props.dbEntry.tags.sort().join(" "),
            dbEntry: this.props.dbEntry,
            imageKey: new Date().getTime(),
        };
    }

    resetRotation() {
        this.setState({
            dbEntry: {
                ...this.state.dbEntry,
                rotateDegrees: 0,
            },
            imageKey: new Date().getTime(),
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
        ].filter(Boolean).join("");

        const rotate = (by: number) => {
            let rotateDegrees = this.state.dbEntry.rotateDegrees;
            rotateDegrees = Math.floor(rotateDegrees + 360 + by) % 360;
            this.setState({
                dbEntry: {
                    ...this.state.dbEntry,
                    rotateDegrees,
                },
                imageKey: new Date().getTime(),
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
        ].filter(Boolean).join("");

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

        const geo = Geo.forSha(this.props.sha);

        return (
            <div>
                <form
                    onSubmit={(e) => { e.preventDefault(); this.onSubmit(); }}
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
                            onChange={e => this.setState({
                                textValue: e.target.value,
                                dbEntry: {
                                    ...this.state.dbEntry,
                                    text: e.target.value.trim(),
                                },
                            })}
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
                        Rotate:{' '}{this.state.dbEntry.rotateDegrees}°
                    </p>

                    <p>
                        <input type="button" value="Rotate" onKeyDown={e => this.onKeyDown(e)}/>
                        <input type="submit" value="Save"/>
                        <input type="reset" value="Cancel"/>
                        <input type="button" value="Delete" onClick={() => this.confirmThenDelete()} className="danger"/>
                    </p>

                </form>

                <ImageLoader
                    sha={this.props.sha}
                    entry={this.props.entry}
                    preferredThumbnail={"1000x1000"}
                    render={
                        ({ src, widthAndHeight }) => {
                        if (!src) return null;
                        if (!widthAndHeight) return null;

                        return (
                            <ImageWithGeometry
                                key={this.state.imageKey}
                                desiredSize={800}
                                src={src}
                                widthAndHeight={widthAndHeight}
                                dbEntry={this.state.dbEntry}
                                onChangeDBEntry={(newEntry: DBEntry) => this.setState({
                                    dbEntry: {
                                        ...this.state.dbEntry,
                                        rotateDegrees: newEntry.rotateDegrees,
                                        centerXRatio: newEntry.centerXRatio,
                                        centerYRatio: newEntry.centerYRatio,
                                        radiusRatio: newEntry.radiusRatio,
                                    },
                                    imageKey: new Date().getTime(),
                                })}
                            />
                        );
                    }}
                />

                <hr/>

                <pre>{JSON.stringify(this.props.entry, null, 2)}</pre>
                <pre>{JSON.stringify(Array.from(this.props.entry.thumbnails.keys()).sort())}</pre>
                <pre>{JSON.stringify(currentExifDbEntries.getValue()?.get(this.props.sha), null, 2)}</pre>

                <p>
                    {geo ? <a href={geo.geohackUrl}>geo</a> : "No GPS data"}
                </p>
            </div>
        );
    }

}

export default EditImage;
