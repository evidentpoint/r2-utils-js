// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IPropertyConverter, JsonValue } from "ta-json";

export class JsonDateConverter implements IPropertyConverter {
    public serialize(property: Date): JsonValue {
        return property.toISOString();
    }

    public deserialize(value: JsonValue): Date {
        return new Date(value as string);
    }

    public collapseArrayWithSingleItem(): boolean {
        return false;
    }
}
