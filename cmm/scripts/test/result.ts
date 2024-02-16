import { PathLike} from "fs";

export interface TestResultItem {
    answer: PathLike;
    candidate: PathLike;
    message: string;
}

export interface TestResult {
    items: {
        [key: string]: TestResultItem[],
    };
}
