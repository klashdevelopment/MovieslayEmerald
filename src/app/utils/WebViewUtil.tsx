declare global {
    interface Window {
        chrome?: {
            webview?: {
                postMessage: (message: any) => void;
            };
        };
    }
}
export function sendToHost(message: any) {
    if (window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage(message);
    } else {
        console.warn("Not running inside WebView2");
    }
}