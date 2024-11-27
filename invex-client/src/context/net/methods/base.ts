import { Axios, AxiosRequestConfig, AxiosResponse } from "axios";
import {
    isReady,
    NetContextType,
    NetStateAuthed,
    NetStateReady,
} from "../types";
import { randomId } from "@mantine/hooks";

export class ApiBase {
    private _id: string;
    public constructor(private context: NetContextType) {
        this._id = randomId();
    }

    public get id(): string {
        return this._id;
    }

    public setSecretKey(value: string | null): void {
        if (isReady(this.context)) {
            this.context.setSecretKey(value ?? "");
        }
    }
}
