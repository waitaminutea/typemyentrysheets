// popup.js — 設定画面のロジック
// chrome.storage.local への保存・読み込みと、content.js への入力指示を行う

// 保存対象のフィールドID一覧
const FIELD_IDS = [
  "sei", "mei", "sei_kana", "mei_kana",
  "birthYear", "birthMonth", "birthDay",
  "tel", "mail",
  "zip", "prefecture", "address",
  "university", "faculty", "department",
  "gradYear", "gradMonth"
];

// ステータスメッセージを短時間表示する
function showStatus(msg, color = "#16a34a") {
  const el = document.getElementById("status");
  el.style.color = color;
  el.textContent = msg;
  setTimeout(() => { el.textContent = ""; }, 2500);
}

// ストレージから値を読み込んで各フィールドに反映する
function loadFromStorage() {
  chrome.storage.local.get(FIELD_IDS, (data) => {
    FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && data[id] !== undefined) {
        el.value = data[id];
      }
    });
  });
}

// 各フィールドの値をストレージに保存する
function saveToStorage() {
  const data = {};
  FIELD_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });

  chrome.storage.local.set(data, () => {
    showStatus("✅ 保存しました");
  });
}

// アクティブタブの content.js に入力指示メッセージを送る
function fillCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      showStatus("⚠️ タブが取得できません", "#dc2626");
      return;
    }

    // まずストレージの最新値を保存してから送信する
    const data = {};
    FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) data[id] = el.value;
    });

    chrome.storage.local.set(data, () => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "fill" }, (response) => {
        if (chrome.runtime.lastError) {
          // content_scripts が未挿入のページの場合はエラーになる
          showStatus("⚠️ このページには対応していません", "#dc2626");
          return;
        }
        if (response && response.success) {
          showStatus(`✅ ${response.filled} 件入力しました`);
        } else {
          showStatus("⚠️ 入力できるフィールドが見つかりませんでした", "#b45309");
        }
      });
    });
  });
}

// DOMが読み込まれたら初期化する
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();

  document.getElementById("btnSave").addEventListener("click", saveToStorage);
  document.getElementById("btnFill").addEventListener("click", fillCurrentPage);
});
