import { getDate } from "@/utils/time";
import { TimeOfDay } from "../types";

let totalTime = 0; // seconds

const date = getDate();

function init() {
  const todayDefault = {
    date,
    value: 0,
  };
  // 初始化时间数据
  chrome.storage.local.get("time").then(({ time }) => {
    if (time) {
      const target = (time as TimeOfDay[]).find((item) => item.date === date);
      if (target) {
        totalTime = target.value;
        return;
      }
      // Push new time data to local storage
      if (time.length >= 30) {
        time.shift();
      }
      time.push(todayDefault);
      chrome.storage.local.set({
        time,
      });
    } else {
      chrome.storage.local.set({ time: [todayDefault] });
    }
  });
  // 接收来自内容脚本的消息，更新浏览总时间
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PAGE_RECORD_TIME") {
      totalTime++;
    }
  });
  // 每隔10秒更新一次本地存储
  setInterval(() => {
    chrome.storage.local.get("time", ({ time }) => {
      if (time) {
        const target = (time as TimeOfDay[]).find((item) => item.date === date);
        if (target) {
          target.value = totalTime;
          chrome.storage.local.set(
            {
              time,
            },
            () => {
              if (chrome.runtime.lastError) {
                console.error("storage error : " + chrome.runtime.lastError);
              }
            }
          );
        }
      }
    });
  }, 1000 * 10);
  // 监听推荐视频请求的完成
  chrome.webRequest.onCompleted.addListener(
    (details) => {
      const id = details.tabId;
      chrome.tabs.sendMessage(id, "RECOMMEND_REQUEST_COMPLETE");
    },
    {
      urls: [
        "https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd*",
      ],
    }
  );
}

init();
