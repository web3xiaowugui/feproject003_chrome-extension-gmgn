// console.log("Colibri service_worker.js")

import {
    Notice,
    NoticeKey,
    StorageKey,
} from "@colibri/shared-utils/lib/consts";

// 同步数据
function setStore(k, v) {
    chrome.storage.local.set({[k]: v});
}

// 获取数据
function getStore(key, defaultValue = null) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
            if (result.hasOwnProperty(key)) resolve(result[key]);
            else resolve(defaultValue);
        });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true});
});


/*
例子
{
    "type": "colibri:notice:type",
    "to": "colibri:notice:background",
    "key": "colibri:notice:global-switch",
    "value": true
}

{
    "type": "colibri:notice:type",
    "to": "colibri:notice:background",
    "key": "colibri:notice:hit-rate",
    "value": {
        "url": "https://gmgn.ai/_next/static/css/beac95bcec9e3f3f.css",
        "match_url": "https://gmgn.ai",
        "method": "ANY"
    }
}

{
    "type": "colibri:notice:type",
    "to": "colibri:notice:background",
    "key": "colibri:notice:hit-rate",
    "value": {
        "url": "https://gmgn.ai/defi/quotation/v1/follow/sol/following_wallets?network=sol...",
        "match_url": "https://gmgn.ai",
        "method": "GET"
    }
}
*/
// 接收content 传来的信息
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === Notice.TYPE && msg.to === Notice.TO_BACKGROUND) {

        // 判断启用状态
        if (msg.key === NoticeKey.GLOBAL_SWITCH) {
            chrome.action.setIcon({
                path: msg.value ? "icons/128.png" : "icons/128g.png",
            });
        }
        // 监听命中率
        if (msg.key === NoticeKey.HIT_RATE) {
            // 收集gmgn所有url
            const baseXwgUrl = "http://localhost:9001"
            fetch(baseXwgUrl + "/gmgn_api_collector", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(msg.value),
            }).then(response => {
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                return response.json();
            }).then(data => {
            }).catch(error => {
                console.error("Error", error)
            });

            // 获取本地拦截列表
            getStore(StorageKey.INTERCEPT_LIST, [])
                .then(interceptList => {
                    // 总命中率
                    let counter = 0;
                    interceptList.forEach((target) => {
                        if (target.switch_on) {
                            if (
                                target.match_url === msg.value?.match_url &&
                                (target.method === "ANY" || target.method === msg.value?.method)
                            ) {
                                const totalHit = target.hit ? target.hit + 1 : 1;
                                target.hit = totalHit;
                                counter += totalHit;
                            } else if (target.hit) {
                                counter += target.hit;
                            }
                        }
                    })
                    // 更新本地拦截列表
                    setStore(StorageKey.INTERCEPT_LIST, interceptList);

                    // 更新徽章 显示命中率
                    chrome.action.setBadgeBackgroundColor({color: "#006d75"});
                    if (counter) chrome.action.setBadgeText({text: `+${counter}`});
                    else chrome.action.setBadgeText({text: ""});
                })
        }
    }
});
