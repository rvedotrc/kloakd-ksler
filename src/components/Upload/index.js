import React, { Component } from 'react';

import Dropzone from 'react-dropzone'
import PropTypes from "prop-types";

class Upload extends Component {

    constructor(props) {
        super(props);
        this.state = {
            queuedUploads: [],
            uploadTasks: [],
            forceReupload: false,
            dryRun: false,
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
            })
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

                const existingImage = this.state.bySha[digestString];

                if (existingImage) {
                    if (this.state.forceReupload) {
                        console.log(`Uploading ${file.path} even though it already exists at ${path}`, existingImage);
                    } else {
                        console.log(`Declining to upload ${file.path} because it already exists at ${path}`, existingImage);
                        return;
                    }
                } else {
                    console.debug(`No existing image found for ${digestString}, continuing`);
                }

                if (this.state.dryRun) {
                    console.log(`Would upload ${file.path} but dryRun is enabled`);
                    return;
                }

                return this.enqueueUpload(file, path);
            }).catch(error => {
                console.log("error while processing file", file.name, ":", error);
            });
        });
    }

    render() {
        const { bySha, forceReupload, dryRun } = this.state;

        return (
            <div>

                <h1>Upload Images</h1>

                {!bySha && (
                    <p>Loading file list...</p>
                )}

                {bySha && (
                    <Dropzone onDrop={files => this.uploadFiles(files)}>
                        {({getRootProps, getInputProps}) => (
                            <section>
                                <div {...getRootProps()}>
                                    <input {...getInputProps()} />
                                    <p>Feed me, Seymour! Drop your pictures here, or click to choose some files. Nom nom nom.</p>
                                </div>
                            </section>
                        )}
                    </Dropzone>
                )}

                <p>
                    <input type={"checkbox"} checked={forceReupload} onChange={() => this.setState({ forceReupload: !forceReupload })}/>
                    Force re-upload if already present
                </p>

                <p>
                    <input type={"checkbox"} checked={dryRun} onChange={() => this.setState({ dryRun: !dryRun })}/>
                    Dry run
                </p>

            </div>
        )
    }

}

Upload.propTypes = {
    user: PropTypes.object.isRequired
};

export default Upload;
