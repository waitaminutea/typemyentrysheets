// content.js — フォーム自動入力スクリプト
// 就職活動サイトのエントリーフォームに chrome.storage.local の個人情報を入力する

"use strict";

// ============================================================
// React / Vue 管理下の input にも確実に値を反映するための
// ネイティブ setter を事前に取得しておく
// ============================================================
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  "value"
).set;

const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  "value"
).set;

// ============================================================
// フィールドマップを fetch で読み込む（content_scripts からは
// chrome.runtime.getURL でアクセスする）
// ============================================================
async function loadFieldMap() {
  const url = chrome.runtime.getURL("fieldMap.json");
  const res = await fetch(url);
  const json = await res.json();
  return json.fields; // Array<{ storageKey, selectors }>
}

// ============================================================
// React/Vue 対応の値セット関数
// input イベントと change イベントを両方発火させる
// ============================================================
function setNativeValue(el, value) {
  if (el.tagName === "TEXTAREA") {
    nativeTextAreaValueSetter.call(el, value);
  } else {
    nativeInputValueSetter.call(el, value);
  }

  // React の合成イベントに検知させる
  el.dispatchEvent(new Event("input",  { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// ============================================================
// select 要素に値をセットする
// option の value または textContent で一致するものを選択する
// ============================================================
function setSelectValue(el, value) {
  // value 完全一致を最優先で探す
  let matched = Array.from(el.options).find(
    (opt) => opt.value === value
  );

  // 見つからなければ textContent の部分一致で探す
  if (!matched) {
    matched = Array.from(el.options).find(
      (opt) => opt.textContent.trim().includes(value)
    );
  }

  if (matched) {
    el.value = matched.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  return false;
}

// ============================================================
// radio button グループに値をセットする
// ============================================================
function setRadioValue(name, value) {
  const radios = document.querySelectorAll(`[type="radio"][name="${name}"]`);
  let filled = false;
  radios.forEach((radio) => {
    if (radio.value === value || radio.dataset.value === value) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      filled = true;
    }
  });
  return filled;
}

// ============================================================
// 1つのフィールドエントリに対して最初にマッチした要素を埋める
// 返り値: 入力した要素数（0 or 1）
// ============================================================
function fillField(fieldEntry, value) {
  if (value === undefined || value === null || value === "") return 0;

  for (const selector of fieldEntry.selectors) {
    let el;
    try {
      el = document.querySelector(selector);
    } catch {
      // 不正なセレクタはスキップ
      continue;
    }
    if (!el) continue;

    const tag = el.tagName;

    if (tag === "SELECT") {
      return setSelectValue(el, String(value)) ? 1 : 0;
    }

    if (tag === "INPUT") {
      const type = el.type.toLowerCase();

      if (type === "radio") {
        // name 属性でグループ全体を操作する
        return setRadioValue(el.name, String(value)) ? 1 : 0;
      }

      if (type === "checkbox") {
        // 値が "true" または "1" のときチェックを入れる
        const checked = (value === true || value === "true" || value === "1");
        el.checked = checked;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return 1;
      }

      // text / tel / email / number 等
      setNativeValue(el, String(value));
      return 1;
    }

    if (tag === "TEXTAREA") {
      setNativeValue(el, String(value));
      return 1;
    }
  }

  return 0;
}

// ============================================================
// 完了トーストを表示する（既存のものがあれば再利用）
// ============================================================
function showToast(message) {
  // 既存のトーストがあれば削除
  const existing = document.getElementById("__jikatu_toast__");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "__jikatu_toast__";
  toast.textContent = message;

  Object.assign(toast.style, {
    position:        "fixed",
    top:             "16px",
    right:           "16px",
    zIndex:          "2147483647",
    background:      "#16a34a",
    color:           "#fff",
    fontSize:        "14px",
    fontFamily:      "sans-serif",
    fontWeight:      "bold",
    padding:         "10px 18px",
    borderRadius:    "6px",
    boxShadow:       "0 4px 12px rgba(0,0,0,0.25)",
    opacity:         "1",
    transition:      "opacity 0.5s ease",
    pointerEvents:   "none",
  });

  document.body.appendChild(toast);

  // 2.5秒後にフェードアウトして削除
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 600);
  }, 2500);
}

// ============================================================
// メイン処理: ストレージの値を読み込んでフォームを埋める
// ============================================================
async function fillForm() {
  // フィールドマップを読み込む
  const fields = await loadFieldMap();

  // 保存済み個人情報をすべて取得する
  const storageKeys = fields.map((f) => f.storageKey);

  return new Promise((resolve) => {
    chrome.storage.local.get(storageKeys, (data) => {
      let filledCount = 0;

      fields.forEach((fieldEntry) => {
        const value = data[fieldEntry.storageKey];
        filledCount += fillField(fieldEntry, value);
      });

      if (filledCount > 0) {
        showToast(`入力完了 ✓（${filledCount} 件）`);
      }

      resolve({ success: filledCount > 0, filled: filledCount });
    });
  });
}

// ============================================================
// popup.js からのメッセージを受け取るリスナー
// ============================================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "fill") {
    // 非同期処理のために true を返し、sendResponse を保持する
    fillForm().then((result) => {
      sendResponse(result);
    }).catch((err) => {
      console.error("[自動入力] エラー:", err);
      sendResponse({ success: false, filled: 0 });
    });
    return true; // sendResponse を非同期で呼ぶために必要
  }
});

// ============================================================
// ページ読み込み完了時にフォームの存在を確認する（任意の自動実行）
// 自動入力は行わず、フォームの存在のみログに記録する
// ============================================================
(function checkForm() {
  const hasForm = document.querySelector("form") !== null;
  if (hasForm) {
    console.info("[自動入力] エントリーフォームを検出しました。ポップアップから「このページに入力する」を押してください。");
  }
})();
