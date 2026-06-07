// CDN設定 — jsDelivr → GitHub Raw の順でフォールバック
window.CDN_PROVIDERS = [
  "https://cdn.jsdelivr.net/gh/kuru-bana/Games@main",
  "https://raw.githubusercontent.com/kuru-bana/Games/main"
];
window.CDN_BASE = window.CDN_PROVIDERS[0];

// loaderスクリプトをCDNプロバイダーの優先順で試す
// onSuccess(activeBase) : 読み込めたプロバイダのベースURLを渡す
// onFail()              : 全て失敗した場合
window.loadWithFallback = function(subpath, onSuccess, onFail) {
  var providers = window.CDN_PROVIDERS.slice();
  var idx = 0;
  function tryNext() {
    if (idx >= providers.length) {
      if (onFail) onFail();
      return;
    }
    var base = providers[idx++];
    var s = document.createElement('script');
    s.src = base + subpath;
    s.onload = function() {
      window.CDN_BASE = base;
      onSuccess(base);
    };
    s.onerror = tryNext;
    document.body.appendChild(s);
  }
  tryNext();
};
