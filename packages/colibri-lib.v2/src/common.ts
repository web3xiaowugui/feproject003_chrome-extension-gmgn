import { IFilterType } from "./types";
import { Notice } from "@colibri/shared-utils";

// match_url规则匹配
export function maybeMatching(url: string, match: string, type: IFilterType = "normal") {
    let matched = false;
    switch (type) {
        // 普通匹配规则
        case "normal":
            matched = url.includes(match);
            break;
        // 正则匹配规则
        case "regex":
            try {
                url.match(new RegExp(match, "i")) && (matched = true);
            } catch (error) { }
            break;
    }
    return matched;
}

// 通知到 content 命中统计
export function notice(client: String, url: string, match_url: string, method: string, api_data: Object) {
    window.dispatchEvent(
        new CustomEvent(Notice.TO_CONTENT, {
            detail: { client, url, match_url, method, api_data },
        })
    );
}

export const warn = (...args: any[]) => console.warn(...args)
