import * as React from 'react';

import {ImageFileGroupMap} from '../../types';
import {ExifParserFactory} from "ts-exif-parser";
import {currentExifDbEntries, currentImageFileGroups} from "lib/app_context";
import {CallbackRemover} from "lib/observer";

declare const firebase: typeof import('firebase');

type Props = {
    user: firebase.User;
};

type State = {
    bySha?: ImageFileGroupMap;
    ref?: firebase.database.Reference;
    jobs: Job[];
    didSync?: boolean;
    stopObservingExifDb?: CallbackRemover;
    stopObservingFileGroups?: CallbackRemover;
};

type Job = {
    sha: string;
    type: "fetch" | "delete";
    status: "queued" | "running" | "completed" | "failed";
    message?: string;
};

class ExifExtraction extends React.Component<Props, State> {

    private updateTimer: number | undefined;

    constructor(props: Props) {
        super(props);

        this.state = {
            jobs: [],
        };
    }

    componentDidMount() {
        const stopObservingExifDb = currentExifDbEntries.observe(() => {
            this.forceUpdate();
            this.startSync();
        });
        this.setState({ stopObservingExifDb });

        const stopObservingFileGroups = currentImageFileGroups.observe(() => {
            this.forceUpdate();
            this.startSync();
        });

        this.setState({ stopObservingFileGroups });
    }

    componentWillUnmount() {
        this.state?.stopObservingExifDb?.();
        this.state?.stopObservingFileGroups?.();
    }

    private startSync() {
        if (this.state.didSync) return;

        const dbValue = currentExifDbEntries.getValue();
        if (!dbValue) return;

        const bySha = currentImageFileGroups.getValue();
        if (!bySha) return;

        const jobs = this.state.jobs;

        for (const sha of bySha.keys()) {
            if (!dbValue.has(sha)) {
                jobs.push({
                    sha,
                    type: "fetch",
                    status: "queued",
                });
            }
        }

        for (const sha of dbValue.keys()) {
            if (!bySha.has(sha)) {
                jobs.push({
                    sha,
                    type: "delete",
                    status: "queued",
                });
            }
        }

        this.setState({ didSync: true });
        this.maybeStartJob();
        this.forceUpdate();
    }

    private maybeStartJob() {
        const { ref, jobs } = this.state;
        if (!ref) return;

        const nRunning = jobs.filter(job => job.status === "running").length;
        // console.log(`maybeStartJob nRunning=${nRunning}`);
        if (nRunning >= 5) return;

        const job = jobs.find(j => j.status === "queued");
        // console.log(`maybeStartJob next job=${job}`);
        if (!job) return;

        console.log(`Starting job ${job.sha}`);
        job.status = "running";

        const jobPromise: Promise<string> = (
            job.type === "fetch" ? this.runFetchJob(job)
            : job.type === "delete" ? this.runDeleteJob(job)
            : Promise.reject("No runner for this job type")
        );

        jobPromise
            .then(message => {
                job.status = "completed";
                job.message = message;
            }).catch(err => {
                job.status = "failed";
                job.message = err.toString();
            }).finally(() => {
                console.log(`Job ${job.sha} done`);
                this.maybeStartJob();
                this.forceUpdate();
            });

        this.maybeStartJob();
    }

    // private updateJobList() {
    //     if (this.updateTimer) return null;
    //
    //     this.updateTimer = window.setInterval(
    //         () => {
    //             this.forceUpdate();
    //             this.updateTimer = undefined;
    //         },
    //         200,
    //     );
    // }

    private runFetchJob(job: Job): Promise<string> {
        const bySha = this.state.bySha;
        if (!bySha) throw "No bySha";

        const ref = this.state.ref;
        if (!ref) throw "No ref";

        const path = bySha.get(job.sha)?.main?.path;
        if (!path) throw "No path";

        return firebase.storage().ref(path).getDownloadURL()
            .then(url => {
                return new Promise<Buffer | ArrayBuffer>(
                    ((resolve, reject) => {
                        const req = new XMLHttpRequest();

                        req.addEventListener("load", () => {
                            resolve(req.response);
                        });
                        req.addEventListener("error", evt => {
                            console.log(`on error for ${job.sha}`, evt)
                            reject("It failed");
                        });

                        req.open("GET", url);
                        req.setRequestHeader("Range", "0-65634");
                        req.responseType = "arraybuffer";
                        req.send();
                    })
                );
            }).then(imageData => {
                const parser = ExifParserFactory.create(imageData);
                const exifData = parser.parse();

                // console.log(`Got EXIF data for ${job.sha}: ${exifData} aka`, exifData);

                return exifData.tags;
            }).then(tags => {
                return ref.child(job.sha).child("tags").set(tags)
                    .then(() => Object.keys(tags as any).sort().join(" "));
            });
    }

    private runDeleteJob(job: Job): Promise<string> {
        const ref = this.state.ref;
        if (!ref) throw "No ref";

        return ref.child(job.sha).remove().then(() => "");
    }

    render() {
        const { jobs } = this.state;
        const bySha = currentImageFileGroups.getValue();
        const dbValue = currentExifDbEntries.getValue();

        return (
            <div>
                <h1>EXIF Extraction</h1>

                {!bySha && (
                    <p>Loading file list...</p>
                )}

                {bySha && <p>Loaded {bySha.size} files</p>}

                {!dbValue
                    ? <p>Loading database...</p>
                    : <p>DB has {dbValue.size} entries</p>}

                <h2>Jobs</h2>
                <table>
                    <thead>
                        <tr>
                            <th>SHA</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job, index) => (
                            <tr key={index}>
                                <td title={job.sha}>{job.sha.substr(0, 6)}</td>
                                <td>{job.type}</td>
                                <td>{job.status}</td>
                                <td>{job.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

}

export default ExifExtraction;
