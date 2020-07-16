import * as React from 'react';

import Dropzone from 'react-dropzone'

import {ImageFile, ImageFileGroup, ImageFileGroupMap} from '../../types';
import fileReader from "../../file_reader";

declare const firebase: typeof import('firebase');

type Props = {
    user: firebase.User;
};

type State = {
    jobs: UploadJob[];
    forceReupload: boolean;
    dryRun: boolean;
    bySha?: ImageFileGroupMap;
    dbValue?: boolean;
    ref?: firebase.database.Reference;
    reRenderTimer?: number;
};

type UploadJob = {
    id: number;
    file: File;
    path: string;
    state: "queued" | "running" | "failed" | "complete";
    percent?: number;
    error?: Error | string;
};

class Upload extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            jobs: [],
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
        fileReader(this.props.user, false)
            .then(imageFileGroupMap => {
                this.setState({ bySha: imageFileGroupMap });
            })
            .catch(e => console.log('storage list failed', e));
    }

    startUpload(job: UploadJob) {
        const { file, path } = job;

        job.state = "running";
        job.percent = 0;
        this.shouldReRender();

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
                // console.log("file", path, `upload progress is ${percent}%`);
                job.percent = percent;
                this.shouldReRender();
            },
            error => {
                // console.log("file", path, "upload failed:", error);
                job.state = "failed";
                job.error = error;
                this.maybeStartUpload();
                this.shouldReRender();
            },
            () => {
                // console.log("file", path, "upload complete. woot!");
                job.state = "complete";
                this.maybeStartUpload();
                this.shouldReRender();
            },
        );

        return uploadTask;
    }

    enqueueUpload(file: File, path: string) {
        const id = new Date().getTime();
        const job: UploadJob = { id, file, path, state: "queued" };
        // console.log("enqueue upload", job);
        this.state.jobs.push(job);
        this.shouldReRender();
        this.maybeStartUpload();
    }

    shouldReRender() {
        this.setState((prevState) => {
            if (prevState.reRenderTimer) return prevState;

            const reRenderTimer = window.setTimeout(
                () => {
                    this.setState({ reRenderTimer: undefined });
                    this.forceUpdate();
                },
                100,
            );

            return { ...prevState, reRenderTimer };
        });
    }

    maybeStartUpload() {
        const nActive = this.state.jobs.filter(job => job.state === 'running').length;
        if (nActive >= 5) return;

        const job = this.state.jobs.find(job => job.state === 'queued');
        if (!job) return;

        // console.log("Starting upload", job);
        return this.startUpload(job);
    }

    addTerminalJob(file: File, state: "complete" | "failed", path: string, error: string) {
        const id = new Date().getTime();
        const job: UploadJob = { id, file, path, state, error };
        this.state.jobs.push(job);
        this.shouldReRender();
    }

    uploadFiles(files: File[]) {
        const { bySha } = this.state;
        if (!bySha) return;

        // console.log("files =", files);

        files.map(file => {
            file.arrayBuffer().then(buffer => {
                return crypto.subtle.digest('SHA-256', buffer);
            }).then(digestBuffer => {
                const digestArray = Array.from(new Uint8Array(digestBuffer));
                const digestString = digestArray.map(b => b.toString(16).padStart(2, '0')).join('');
                console.log({ file });
                console.log("file", file.name, "has digest", digestString);

                const path = `user/${this.props.user.uid}/images/sha-256-${digestString}`;

                const existingImage = bySha.get(digestString);

                if (existingImage?.main) {
                    if (this.state.forceReupload) {
                        console.log(`Uploading ${file.name} even though it already exists at ${path}`, existingImage);
                    } else {
                        console.log(`Declining to upload ${file.name} because it already exists at ${path}`, existingImage);
                        this.addTerminalJob(file, "complete", path, `Declined to upload because the target already exists`);
                        return;
                    }
                } else {
                    console.debug(`No existing image found for ${digestString}, continuing`);
                }

                if (this.state.dryRun) {
                    console.log(`Would upload ${file.name} but dryRun is enabled`);
                    this.addTerminalJob(file, "complete", path, "Declined to upload because dryRun was enabled");
                    return;
                }

                return this.enqueueUpload(file, path);
            }).catch(error => {
                console.log("error while processing file", file.name, ":", error);
                this.addTerminalJob(file, "failed", "?", error);
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
                    <Dropzone
                        onDrop={files => this.uploadFiles(files)}
                        accept=".jpg,.png"
                    >
                        {({getRootProps, getInputProps, isDragActive}) => (
                            <section>
                                <div {...getRootProps()}
                                    className={isDragActive ? "dropZone dropZoneActive" : "dropZone dropZoneInactive"}
                                    >
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

                {this.state.jobs[0] && (
                    <table>
                        <thead>
                            <th>ID</th>
                            <th>Local file</th>
                            <th>State</th>
                            <th>Progress</th>
                            <th>Error</th>
                        </thead>
                        <tbody>
                            {this.state.jobs.map(job => (
                                <tr key={job.id}>
                                    <td>{job.id}</td>
                                    <td>{job.file.name}</td>
                                    <td>{job.state}</td>
                                    <td>{job.percent && `${job.percent}%`}</td>
                                    <td>{job.error}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

            </div>
        )
    }

}

export default Upload;
