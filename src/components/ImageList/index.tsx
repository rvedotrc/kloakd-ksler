import * as React from 'react';
import * as ReactModal from 'react-modal';

import EditImage from "./edit_image";
import ImageIcon from "./image_icon";
import {DBEntry, ImageFileGroupMap} from "lib/types";
import {currentImageDbEntries, currentImageFileGroups, currentImageFiles} from "lib/app_context";
import {CallbackRemover} from "lib/observer";

declare const firebase: typeof import('firebase');

type Props = {
    user: firebase.User;
};

type DisplayStyle = "grid" | "list" | "thumbnails";

type State = {
    displayStyle: DisplayStyle;
    openImageSha?: string;
    filterText?: string;
    effectiveFilterValue?: string;
    shaFilter?: Map<string, boolean>;
    stopObservingImageDb?: CallbackRemover;
    stopObservingFileGroups?: CallbackRemover;
};

class ImageList extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            displayStyle: "grid",
        };
    }

    componentDidMount() {
        const stopObservingImageDb = currentImageDbEntries.observe(() => {
            this.forceUpdate();
        });
        this.setState({ stopObservingImageDb });

        const stopObservingFileGroups = currentImageFileGroups.observe(() => {
            this.forceUpdate();
        });

        this.setState({ stopObservingFileGroups });
    }

    componentWillUnmount() {
        this.state?.stopObservingImageDb?.();
        this.state?.stopObservingFileGroups?.();
    }

    // Only needed because we don't watch storage properly yet
    shaDeleted(sha: string) {
        const files = currentImageFiles.getValue();
        if (!files) return;

        const copy = new Map(files);

        for (const [k, v] of files) {
            if (v.sha === sha) {
                copy.delete(k);
            }
        }

        currentImageFiles.setValue(copy);
    }

    onUpdateFilter(newText: string) {
        this.setState({ filterText: newText });

        window.setTimeout(() => {
            if ((this.state.effectiveFilterValue || '') === newText) return;

            this.runFilter(newText);
        }, 200);
    }

    runFilter(filterText: string) {
        const bySha = currentImageFileGroups.getValue();
        if (!bySha) return;

        const parts = filterText.trim().split(/\s+/);
        // console.log({ parts });

        const shaFilter = new Map<string, boolean>();

        for (const sha of bySha.keys()) {
            // const image = bySha[sha];
            const dbData: DBEntry = this.getDBEntry(sha);
            // console.log({ sha, image, dbData });

            const matches = parts.every(part => {
                const invert = part.startsWith('-');
                const term = part.replace(/^-/, '');

                const matchesTerm = (
                    dbData.text.includes(term)
                    ||
                    dbData.tags.some(tag => tag.includes(term))
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
                    dbEntry={this.getDBEntry(openImageSha)}
                    onClose={() => this.setState({ openImageSha: undefined })}
                    onDelete={sha => this.shaDeleted(sha)}
                />
            </ReactModal>
        );
    }

    getDBEntry(sha: string): DBEntry {
        const db = currentImageDbEntries.getValue();
        if (!db) throw 'no db';

        return db.get(sha) || {
            text: '',
            tags: [],
            rotateDegrees: 0,
            centerXRatio: 0.5,
            centerYRatio: 0.5,
            radiusRatio: 0.5,
        };
    }

    renderFiles(bySha: ImageFileGroupMap, shaFilter: Map<string, boolean> | undefined, displayStyle: DisplayStyle) {
        const list = this.getSortedList(bySha, shaFilter);

        if (displayStyle === 'grid') {
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
                                    onClick={() => this.setState({openImageSha: sha})}
                                    className={matches ? '' : 'hidden'}
                                >
                                    <ImageIcon
                                        sha={sha}
                                        entry={entry}
                                        dbEntry={this.getDBEntry(sha)}
                                        preferredThumbnail={"200x200"}
                                        desiredSize={100}
                                        withText={true}
                                    />
                                </li>
                            );
                        })}
                    </ol>
                </div>
            );
        } else if (displayStyle === 'thumbnails') {
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
                                    <ImageIcon
                                        sha={sha}
                                        entry={entry}
                                        dbEntry={this.getDBEntry(sha)}
                                        preferredThumbnail={"500x500"}
                                        desiredSize={200}
                                        withText={false}
                                    />
                                </li>
                            );
                        })}
                    </ol>
                </div>
            );
        } else if (displayStyle === 'list') {
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
                                const dbData = this.getDBEntry(sha);

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

        const { shaFilter, displayStyle, openImageSha } = this.state;
        const bySha = currentImageFileGroups.getValue();

        const displayStyles: { value: DisplayStyle; label: string; }[] = [
            { value: "grid", label: "Grid" },
            { value: "list", label: "List" },
            { value: "thumbnails", label: "Thumbnails" },
        ];

        return (
            <div>
                <h1>Image List</h1>

                {openImageSha && bySha && this.renderEditModal(openImageSha, bySha)}

                <p>
                    {displayStyles.map(({ value, label }) => (
                        <span key={value}>
                            <input
                                key={"input-" + value}
                                type={"radio"}
                                name={"displayStyle"}
                                id={"displayStyle-" + value}
                                value={value}
                                checked={displayStyle === value}
                                onChange={() => this.setState({ displayStyle: value })}
                            />
                            <label
                                key={"label-" + value}
                                htmlFor={"displayStyle-" + value}>
                                {label}
                            </label>
                        </span>
                    ))}
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

                {bySha && this.renderFiles(bySha, shaFilter, displayStyle)}
            </div>
        )
    }

}

export default ImageList;
