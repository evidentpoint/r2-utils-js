// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as StreamZip from "node-stream-zip";
import { toWebReadableStream } from "web-streams-node";

import { IStreamAndLength, IZip, Zip } from "./zip";

// import { bufferToStream } from "../stream/BufferUtils";

const debug = debug_("r2:utils#zip/zip1");

export class Zip1 extends Zip {

    public static async loadPromise(filePath: string): Promise<IZip> {

        return new Promise<IZip>((resolve, reject) => {

            const zip = new StreamZip({
                file: filePath,
                storeEntries: true,
            });

            zip.on("error", (err: any) => {
                debug("--ZIP error: " + filePath);
                debug(err);

                reject(err);
            });

            zip.on("entry", (_entry: any) => {
                // console.log("--ZIP: entry");
                // debug(entry.name);
            });

            zip.on("extract", (entry: any, file: any) => {
                debug("--ZIP extract:");
                debug(entry.name);
                debug(file);
            });

            zip.on("ready", () => {
                // console.log("--ZIP: ready");
                // console.log(zip.entriesCount);

                // const entries = zip.entries();
                // console.log(entries);

                resolve(new Zip1(filePath, zip));
            });
        });
    }

    private constructor(readonly filePath: string, readonly zip: any) {
        super();
    }

    public freeDestroy(): void {
        debug("freeDestroy: Zip1 -- " + this.filePath);
        if (this.zip) {
            this.zip.close();
        }
    }

    public entriesCount(): number {
        return this.zip.entriesCount;
    }

    public hasEntries(): boolean {
        return this.entriesCount() > 0;
    }

    public async hasEntry(entryPath: string): Promise<boolean> {
        return this.hasEntries()
            && this.zip.entries()[entryPath];
    }

    public async getEntries(): Promise<string[]> {

        if (!this.hasEntries()) {
            return Promise.resolve([]);
        }
        return Promise.resolve(Object.keys(this.zip.entries()));
    }

    public async entryStreamPromise(entryPath: string): Promise<IStreamAndLength> {

        // debug(`entryStreamPromise: ${entryPath}`);

        if (!this.hasEntries() || !await this.hasEntry(entryPath)) {
            return Promise.reject("no such path in zip: " + entryPath);
        }

        // return new Promise<IStreamAndLength>((resolve, _reject) => {
        //     const buffer: Buffer = this.zip.entryDataSync(entryPath);
        //     const streamAndLength: IStreamAndLength = {
        //         length: buffer.length,
        //         stream: bufferToStream(buffer),
        //     };
        //     resolve(streamAndLength);
        // });

        return new Promise<IStreamAndLength>((resolve, reject) => {

            this.zip.stream(entryPath, (err: any, stream: NodeJS.ReadableStream) => {
                if (err) {
                    reject(err);
                    return;
                }

                const entry = this.zip.entries()[entryPath];

                const streamAndLength: IStreamAndLength = {
                    length: entry.size,
                    reset: async () => {
                        return this.entryStreamPromise(entryPath);
                    },
                    stream: toWebReadableStream(stream),
                };
                resolve(streamAndLength);
            });
        });
    }
}
