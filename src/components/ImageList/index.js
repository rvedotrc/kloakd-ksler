import React, { Component } from 'react';

import PropTypes from "prop-types";
import ReactModal from 'react-modal';

import EditImage from "./edit_image";
import ImageIcon from "./image_icon";

class ImageList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showGrid: true,
            queuedUploads: [],
            uploadTasks: [],
            openImage: null,
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
        var imagesRef = firebase.storage().ref().child(`user/${this.props.user.uid}/images`);

        const bySha = {};

        const promisePage = pageToken => {
            console.log("promisePage", pageToken);

            return imagesRef.list({ pageToken }).then(listResult => {
                const ignoredNames = [];
                const promises = [];

                console.log("promisePage", pageToken, "got", { nextPageToken: listResult.nextPageToken, itemCount: listResult.items.length });

                listResult.items.map(ref => {
                    const match = ref.name.match(/sha-256-(\w{64})(?:_(\d+x\d+))?$/);
                    if (match) {
                        const sha = match[1];
                        const thumbnailSize = match[2];

                        const entry = (bySha[sha] = bySha[sha] || { thumbnails: {} });

                        if (!thumbnailSize) {
                            promises.push(
                                ref.getMetadata().then(metadata => entry.metadata = metadata)
                            );
                        } else {
                            entry.thumbnails[thumbnailSize] = ref.fullPath;
                        }
                    } else {
                        ignoredNames.push(ref.name);
                    }
                });

                if (ignoredNames.length > 0) {
                    console.log("Ignored names:", { ignoredNames });
                }

                if (listResult.nextPageToken) {
                    promises.push(promisePage(listResult.nextPageToken));
                }

                return Promise.all(promises);
            });
        };

        promisePage(null)
            .then(() => {
                this.setState({ bySha });
                this.runFilter(bySha, this.state.filterText || '');
            })
            .catch(e => console.log('storage list failed', e));
    }

    shaDeleted(sha) {
        const { bySha } = this.state;
        if (!bySha) return;

        delete bySha[sha];
        this.setState({ bySha });
    }

    onUpdateFilter(newText) {
        this.setState({ filterText: newText });

        window.setTimeout(() => {
            if ((this.state.effectiveFilterValue || '') === newText) return;

            this.runFilter(this.state.bySha, newText);
        }, 200);
    }

    runFilter(bySha, filterText) {
        const parts = filterText.trim().split(/\s+/);
        // console.log({ parts });
        const dbValue = this.state.dbValue || {};
        const shaFilter = {};

        Object.keys(bySha).map(sha => {
            // const image = bySha[sha];
            const dbData = dbValue[sha] || {};
            // console.log({ sha, image, dbData });

            const matches = parts.every(part => {
                const invert = part.startsWith('-');
                const term = part.replace(/^-/, '');

                const matchesTerm = (
                    (dbData.text || '').includes(term)
                    ||
                    (dbData.tags || []).some(tag => tag.includes(term))
                );

                return !!matchesTerm != !!invert;
            });

            shaFilter[sha] = matches;
        });

        this.setState({ shaFilter, effectiveFilterValue: filterText });
    }

    render() {
        const { bySha, shaFilter, showGrid, dbValue } = this.state;

        return (
            <div>
                <h1>Image List</h1>

                {
                    this.state.openImage && <ReactModal
                        isOpen={true}
                        contentLabel={"Test"}
                        appElement={document.getElementById("react_container")}
                    >
                        <EditImage
                            user={this.props.user}
                            sha={this.state.openImage}
                            entry={this.state.bySha[this.state.openImage]}
                            onClose={() => this.setState({ openImage: null })}
                            onDelete={sha => this.shaDeleted(sha)}
                        />
                    </ReactModal>
                }

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

                {bySha && !showGrid && (
                    <div>
                        <h2>List</h2>
                        <ol className="imageList">
                            {Object.keys(bySha).sort().map(sha => {
                                const entry = bySha[sha];
                                const matches = (!shaFilter || shaFilter[sha]);

                                return (
                                    <li
                                        key={sha}
                                        onClick={() => this.setState({ openImage: sha })}
                                        className={matches ? '' : 'hidden'}
                                    >
                                        {sha}
                                        {' '}
                                        ({entry.metadata.size})
                                        ({Object.keys(entry.thumbnails).sort().join()})
                                        ({JSON.stringify(entry.metadata.customMetadata)})
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                )}

                {bySha && showGrid && dbValue && <div>
                    <ol className="imageGrid">
                        {Object.keys(bySha).sort().map(sha => {
                            const entry = bySha[sha];
                            const matches = (!shaFilter || shaFilter[sha]);

                            return (
                                <li
                                    key={sha}
                                    onClick={() => this.setState({ openImage: sha })}
                                    className={matches ? '' : 'hidden'}
                                >
                                    <ImageIcon sha={sha} entry={entry} dbData={dbValue[sha] || {}}/>
                                </li>
                            );
                        })}
                    </ol>
                </div>}

            </div>
        )
    }

}

ImageList.propTypes = {
    user: PropTypes.object.isRequired
};

export default ImageList;
