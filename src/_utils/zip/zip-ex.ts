// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as filehound from "filehound";
import * as fs from "fs";
import * as path from "path";

import { toWebReadableStream } from "web-streams-node";

import { IStreamAndLength, IZip, Zip } from "./zip";

// import { bufferToStream } from "../stream/BufferUtils";

const debug = debug_("r2:utils#zip/zip-ex");

export class ZipExploded extends Zip {

    public static async loadPromise(dirPath: string): Promise<IZip> {
        return Promise.resolve(new ZipExploded(dirPath));
    }

    private constructor(readonly dirPath: string) {
        super();
    }

    public freeDestroy(): void {
        debug("freeDestroy: ZipExploded -- " + this.dirPath);
    }

    public entriesCount(): number {
        return 0; // TODO: hacky! (not really needed ... but still)
    }

    public hasEntries(): boolean {
        return true; // TODO: hacky
    }

    public async hasEntry(entryPath: string): Promise<boolean> {
        return this.hasEntries()
            && fs.existsSync(path.join(this.dirPath, entryPath));
    }

    public async getEntries(): Promise<string[]> {

        return new Promise<string[]>(async (resolve, _reject) => {

            const dirPathNormalized = fs.realpathSync(this.dirPath);

            const files: string[] = await filehound.create()
                // .discard("node_modules")
                // .depth(5)
                .paths(this.dirPath)
                // .ext([".epub", ".epub3", ".cbz"])
                .find();

            const adjustedFiles = files.map((file) => {
                const filePathNormalized = fs.realpathSync(file);

                let relativeFilePath = filePathNormalized.replace(dirPathNormalized, "");
                debug(relativeFilePath);

                // TODO: is this necessary?
                if (relativeFilePath.indexOf("/") === 0) {
                    relativeFilePath = relativeFilePath.substr(1);
                }

                return relativeFilePath;
            });
            resolve(adjustedFiles);
        });
    }

    public async entryStreamPromise(entryPath: string): Promise<IStreamAndLength> {

        // debug(`entryStreamPromise: ${entryPath}`);

        if (!this.hasEntries() || !this.hasEntry(entryPath)) {
            return Promise.reject("no such path in zip exploded: " + entryPath);
        }

        const fullPath = path.join(this.dirPath, entryPath);
        const stats = fs.lstatSync(fullPath);

        const streamAndLength: IStreamAndLength = {
            length: stats.size,
            reset: async () => {
                return this.entryStreamPromise(entryPath);
            },
            stream: toWebReadableStream(fs.createReadStream(fullPath, { autoClose: false })),
        };

        return Promise.resolve(streamAndLength);
    }
}
