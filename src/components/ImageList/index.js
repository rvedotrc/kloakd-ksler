import React, { Component } from 'react';

import Dropzone from 'react-dropzone'
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
            .then(() => this.setState({ bySha }))
            .catch(e => console.log('storage list failed', e));
    }

    findExistingImage(path) {
        if (!this.state) return;

        const { imageList } = this.state;
        if (!imageList) return;

        return imageList.find(image => image.fullPath == path);
    }

    startUpload(job) {
        const { id, file, path } = job;

        const metadata = {
            contentType: file.type,
            customMetadata: {
                originalName: file.name,
                originalLastModified: "" + file.lastModified,
            },
        };

        const uploadTask = firebase.storage().ref().child(path)
            .put(file, metadata);

        // pause, resume, cancel

        uploadTask.on(
            firebase.storage.TaskEvent.STATE_CHANGED,
            snapshot => {
                var percent = snapshot.bytesTransferred / snapshot.totalBytes * 100;
                console.log("file", path, `upload progress is ${percent}%`);
            },
            error => {
                console.log("file", path, "upload failed:", error);
                this.removeUpload(id);
            },
            () => {
                console.log("file", path, "upload complete. woot!");
                this.removeUpload(id);
            },
        );

        return uploadTask;
    }

    enqueueUpload(file, path) {
        const id = new Date().getTime();
        const job = { id, file, path };
        console.log("enqueue upload", job);
        this.state.queuedUploads.push(job);
        this.maybeStartUpload();
    }

    removeUpload(id) {
        const index = this.state.uploadTasks.findIndex(job => job.id === id);
        if (index < 0) return;

        const job = this.state.uploadTasks[index];

        console.log({
            uploadTasks: this.state.uploadTasks,
            id,
            index,
            job,
        });

        console.log("Upload completed/failed", job);

        this.state.uploadTasks.splice(index, 1);
        this.maybeStartUpload();
    }

    maybeStartUpload() {
        if (this.state.queuedUploads.length === 0) return;
        if (this.state.uploadTasks.length >= 5) return;

        const job = this.state.queuedUploads.shift();
        console.log("Starting upload", job);
        this.state.uploadTasks.push(job);
        return this.startUpload(job);
    }

    uploadFiles(files) {
        console.log("files =", files);

        files.map(file => {
            file.arrayBuffer().then(buffer => {
                return crypto.subtle.digest('SHA-256', buffer);
            }).then(digestBuffer => {
                const digestArray = Array.from(new Uint8Array(digestBuffer));
                const digestString = digestArray.map(b => b.toString(16).padStart(2, '0')).join('');
                console.log({ file });
                console.log("file", file.name, "has digest", digestString);

                const path = `user/${this.props.user.uid}/images/sha-256-${digestString}`;

                const existingImage = this.findExistingImage(path);
                console.log({ existingImage });

                if (existingImage && existingImage.metadata.timeCreated > '2020-04-19T17:50:') {
                    console.log(`Declining to upload ${file.path} because it already exists at ${path}`, existingImage);
                    return;
                }

                return this.enqueueUpload(file, path);
            }).catch(error => {
                console.log("error while processing file", file.name, ":", error);
            });
        });
    }

    render() {
        const { bySha, showGrid } = this.state;

        return (
            <div>
                <h1>Image List / Upload</h1>

                <p>Let&apos; collect pictures of manhole covers! Some of them are so pretty!</p>

                <h2>Feed me!</h2>

                <Dropzone onDrop={this.uploadFiles.bind(this)}>
                    {({getRootProps, getInputProps}) => (
                        <section>
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <p>Drop your pictures here, or click to choose some files. Nom nom nom.</p>
                            </div>
                        </section>
                    )}
                </Dropzone>

                {
                    this.state.openImage && <ReactModal
                        isOpen={true}
                        contentLabel={"Test"}
                        appElement={document.getElementById("react_container")}
                    >
                        <EditImage
                            sha={this.state.openImage}
                            entry={this.state.bySha[this.state.openImage]}
                            onClose={() => this.setState({ openImage: null })}
                        />
                    </ReactModal>
                }

                <p>
                    <input type={"checkbox"} checked={showGrid} onClick={() => this.setState({ showGrid: !showGrid })}/>
                    Grid view
                </p>

                {bySha && !showGrid && (
                    <div>
                        <h2>List</h2>
                        <ol className="imageList">
                            {Object.keys(bySha).sort().map(sha => {
                                const entry = bySha[sha];

                                return (
                                    <li
                                        key={sha}
                                        onClick={() => this.setState({ openImage: sha })}
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

                {bySha && showGrid && <div>
                    <ol className="imageGrid">
                        {Object.keys(bySha).sort().map(sha => {
                            const entry = bySha[sha];

                            return (
                                <li
                                    key={sha}
                                    onClick={() => this.setState({ openImage: sha })}
                                >
                                    <ImageIcon sha={sha} entry={entry}/>
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
