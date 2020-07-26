import * as React from 'react';
import * as ReactModal from 'react-modal';

import EditImage from "./edit_image";
import ImageIcon from "./image_icon";
import fileReader from "../../file_reader";
import {DBEntry, ImageFileGroup, ImageFileGroupMap} from "../../types";

declare const firebase: typeof import('firebase');

type Props = {
    user: firebase.User;
};

type State = {
    ref?: firebase.database.Reference;
    showGrid: boolean;
    openImageSha?: string;
    dbValue?: any;
    bySha?: ImageFileGroupMap;
    filterText?: string;
    effectiveFilterValue?: string;
    shaFilter?: Map<string, boolean>;
};

class ImageList extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            showGrid: true,
        };
    }

    componentDidMount() {
        const ref = firebase.database().ref(`users/${this.props.user.uid}/images`);
        this.setState({ ref });
        ref.on('value', snapshot => this.setState({ dbValue: snapshot.val() || {}}));

        this.readStorage();
    }

    componentWillUnmount() {
        const { ref } = this.state;
        if (ref) ref.off();
    }

    readStorage() {
        fileReader(this.props.user, true)
            .then(imageFileGroupMap => {
                this.setState({ bySha: imageFileGroupMap });
                this.runFilter(imageFileGroupMap, this.state.filterText || '');
            })
            .catch(e => console.log('storage list failed', e));
    }

    shaDeleted(sha: string) {
        const { bySha } = this.state;
        if (!bySha) return;

        bySha.delete(sha);
        this.setState({ bySha });
    }

    onUpdateFilter(newText: string) {
        this.setState({ filterText: newText });

        window.setTimeout(() => {
            if ((this.state.effectiveFilterValue || '') === newText) return;
            if (!this.state.bySha) return;

            this.runFilter(this.state.bySha, newText);
        }, 200);
    }

    runFilter(bySha: ImageFileGroupMap, filterText: string) {
        const parts = filterText.trim().split(/\s+/);
        // console.log({ parts });
        const dbValue = this.state.dbValue || {};
        const shaFilter = new Map<string, boolean>();

        for (let sha of bySha.keys()) {
            // const image = bySha[sha];
            const dbData = (dbValue[sha] || {}) as DBEntry;
            // console.log({ sha, image, dbData });

            const matches = parts.every(part => {
                const invert = part.startsWith('-');
                const term = part.replace(/^-/, '');

                const matchesTerm = (
                    (dbData.text || '').includes(term)
                    ||
                    (dbData.tags || []).some(tag => tag.includes(term))
                );

                return matchesTerm != invert;
            });

            shaFilter.set(sha, matches);
        }

        this.setState({ shaFilter, effectiveFilterValue: filterText });
    }

    getSortedList(bySha: ImageFileGroupMap, shaFilter: Map<string, boolean> | undefined) {
        return Array.from(bySha.values())
            .sort((a, b) => {
                const k1 = (a.main?.metadata?.customMetadata.originalLastModified || "?") as string;
                const k2 = (b.main?.metadata?.customMetadata.originalLastModified || "?") as string;
                return k1.localeCompare(k2);
            }).map(imageFileGroup => {
                return {
                    imageFileGroup,
                    matches: !shaFilter || shaFilter.get(imageFileGroup.sha),
                };
            });
    }

    renderEditModal(openImageSha: string, bySha: ImageFileGroupMap) {
        const openImageEntry = bySha.get(openImageSha);
        if (!openImageEntry) return null;
        if (!openImageEntry.main?.metadata?.fullPath) return null;

        return (
            <ReactModal
                isOpen={true}
                contentLabel={"Test"}
                appElement={document.getElementById("react_container") || undefined}
            >
                <EditImage
                    user={this.props.user}
                    sha={openImageSha}
                    entry={openImageEntry}
                    dbEntry={this.getDBEntry(this.state.dbValue, openImageSha)}
                    onClose={() => this.setState({ openImageSha: undefined })}
                    onDelete={sha => this.shaDeleted(sha)}
                />
            </ReactModal>
        );
    }

    getDBEntry(dbValue: any, sha: string): DBEntry {
        const entry = dbValue[sha] || {};

        return {
            text: entry.text || "",
            tags: entry.tags || [],
            rotateDegrees: entry.rotateDegrees || 0,
            centerXRatio: entry.centerXRatio || 0.5,
            centerYRatio: entry.centerYRatio || 0.5,
            radiusRatio: entry.radiusRatio || 0.5,
        };
    }

    renderFiles(bySha: ImageFileGroupMap, shaFilter: Map<string, boolean> | undefined, dbValue: any, showGrid: boolean) {
        const list = this.getSortedList(bySha, shaFilter);

        if (showGrid) {
            return (
                <div>
                    <ol className="imageGrid">
                        {list.map(entryAndMatches => {
                            const entry = entryAndMatches.imageFileGroup;
                            const matches = entryAndMatches.matches;
                            const sha = entry.sha;

                            return (
                                <li
                                    key={sha}
                                    onClick={() => this.setState({ openImageSha: sha })}
                                    className={matches ? '' : 'hidden'}
                                >
                                    <ImageIcon sha={sha} entry={entry} dbEntry={this.getDBEntry(dbValue, sha)}/>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            );
        } else {
            return (
                <div>
                    <h2>List</h2>

                    <table className="imageList">
                        <thead>
                            <tr>
                                <th>SHA</th>
                                <th>Original Name</th>
                                <th>Text</th>
                                <th>Tags</th>

                                {/* Debugging stuff below here */}
                                <th>Size</th>
                                <th>100</th>
                                <th>200</th>
                                <th>500</th>
                                <th>1000</th>
                                <th>2000</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(entryAndMatches => {
                                const entry = entryAndMatches.imageFileGroup;
                                const matches = entryAndMatches.matches;
                                const sha = entry.sha;
                                const dbData = this.getDBEntry(dbValue, sha);

                                return (
                                    <tr
                                        key={sha}
                                        onClick={() => this.setState({ openImageSha: sha })}
                                        className={matches ? '' : 'hidden'}
                                    >
                                        <td title={sha}>{sha.substr(0, 6)}</td>
                                        <td>{entry.main?.metadata?.customMetadata.originalName}</td>
                                        <td>{dbData.text}</td>
                                        <td>{dbData.tags.sort().join(" ")}</td>

                                        {/* Debugging stuff below here */}
                                        <td>{entry.main?.metadata?.size}</td>
                                        <td>{entry.thumbnails.has('100x100') && 'Y'}</td>
                                        <td>{entry.thumbnails.has('200x200') && 'Y'}</td>
                                        <td>{entry.thumbnails.has('500x500') && 'Y'}</td>
                                        <td>{entry.thumbnails.has('1000x1000') && 'Y'}</td>
                                        <td>{entry.thumbnails.has('2000x2000') && 'Y'}</td>
                                    </tr>
                                );
                            })}

                        </tbody>
                    </table>
                </div>
            );
        }
    }

    render() {
        if (!this.state) return null;

        const { bySha, shaFilter, showGrid, dbValue, openImageSha } = this.state;

        return (
            <div>
                <h1>Image List</h1>

                {openImageSha && bySha && this.renderEditModal(openImageSha, bySha)}

                <p>
                    <input type={"checkbox"} checked={showGrid} onChange={() => this.setState({ showGrid: !showGrid })}/>
                    Grid view
                </p>

                <p>
                    Filter:{' '}
                    <input
                        type="text"
                        size={50}
                        value={this.state.filterText || ''}
                        onChange={e => this.onUpdateFilter(e.target.value)}
                    />
                </p>

                {bySha && dbValue && this.renderFiles(bySha, shaFilter, dbValue, showGrid)}
            </div>
        )
    }

}

export default ImageList;
