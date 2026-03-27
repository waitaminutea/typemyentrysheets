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
// フィールドマップ定義
// fetch / web_accessible_resources の問題を避けるため
// content.js にインラインで埋め込む
// ============================================================
function loadFieldMap() {
  return [
    {
      storageKey: "sei",
      selectors: [
        "[name='sei']","[name='last_name']","[name='lastName']",
        "[name='family_name']","[name='familyName']","[name='name_sei']",
        "[name='kj_sei']","[name='sei_name']",
        "[id='sei']","[id='last_name']","[id='lastName']",
        "[id='family_name']","[id='familyName']","[id='name_sei']",
        "[placeholder*='姓']","[placeholder*='名字']","[placeholder*='苗字']"
      ]
    },
    {
      storageKey: "mei",
      selectors: [
        "[name='mei']","[name='first_name']","[name='firstName']",
        "[name='given_name']","[name='givenName']","[name='name_mei']",
        "[name='kj_mei']","[name='mei_name']",
        "[id='mei']","[id='first_name']","[id='firstName']",
        "[id='given_name']","[id='givenName']","[id='name_mei']",
        "[placeholder*='名']","[placeholder*='（名）']"
      ]
    },
    {
      storageKey: "sei_kana",
      selectors: [
        "[name='sei_kana']","[name='seiKana']","[name='last_name_kana']",
        "[name='lastNameKana']","[name='family_name_kana']","[name='familyNameKana']",
        "[name='kana_sei']","[name='sei_ruby']","[name='furigana_sei']",
        "[id='sei_kana']","[id='seiKana']","[id='last_name_kana']",
        "[id='lastNameKana']","[id='kana_sei']",
        "[placeholder*='セイ']","[placeholder*='姓（カナ）']",
        "[placeholder*='姓カナ']","[placeholder*='名字（フリガナ）']"
      ]
    },
    {
      storageKey: "mei_kana",
      selectors: [
        "[name='mei_kana']","[name='meiKana']","[name='first_name_kana']",
        "[name='firstNameKana']","[name='given_name_kana']","[name='givenNameKana']",
        "[name='kana_mei']","[name='mei_ruby']","[name='furigana_mei']",
        "[id='mei_kana']","[id='meiKana']","[id='first_name_kana']",
        "[id='firstNameKana']","[id='kana_mei']",
        "[placeholder*='メイ']","[placeholder*='名（カナ）']",
        "[placeholder*='名カナ']","[placeholder*='名前（フリガナ）']"
      ]
    },
    {
      storageKey: "birthYear",
      selectors: [
        "[name='birth_year']","[name='birthYear']","[name='birth_yyyy']",
        "[name='birthday_year']","[name='birthdayYear']","[name='dob_year']",
        "[name='year_of_birth']",
        "[id='birth_year']","[id='birthYear']","[id='birth_yyyy']","[id='birthday_year']",
        "[placeholder*='生年']","[placeholder*='年（西暦）']"
      ]
    },
    {
      storageKey: "birthMonth",
      selectors: [
        "[name='birth_month']","[name='birthMonth']","[name='birth_mm']",
        "[name='birthday_month']","[name='birthdayMonth']","[name='dob_month']",
        "[id='birth_month']","[id='birthMonth']","[id='birth_mm']","[id='birthday_month']"
      ]
    },
    {
      storageKey: "birthDay",
      selectors: [
        "[name='birth_day']","[name='birthDay']","[name='birth_dd']",
        "[name='birthday_day']","[name='birthdayDay']","[name='dob_day']",
        "[id='birth_day']","[id='birthDay']","[id='birth_dd']","[id='birthday_day']"
      ]
    },
    {
      storageKey: "tel",
      selectors: [
        "[name='tel']","[name='phone']","[name='phone_number']","[name='phoneNumber']",
        "[name='mobile']","[name='mobile_phone']","[name='tel_no']","[name='telephone']",
        "[name='cell_phone']",
        "[id='tel']","[id='phone']","[id='phone_number']","[id='phoneNumber']","[id='mobile']",
        "[placeholder*='電話番号']","[placeholder*='携帯番号']",
        "[placeholder*='090']","[placeholder*='080']"
      ]
    },
    {
      storageKey: "mail",
      selectors: [
        "[name='mail']","[name='email']","[name='mail_address']","[name='mailAddress']",
        "[name='e_mail']","[name='email_address']","[name='emailAddress']","[name='contact_mail']",
        "[id='mail']","[id='email']","[id='mail_address']","[id='mailAddress']","[id='email_address']",
        "[type='email']",
        "[placeholder*='メールアドレス']","[placeholder*='メール']","[placeholder*='@']"
      ]
    },
    {
      storageKey: "zip",
      selectors: [
        "[name='zip_cd']","[name='zipCd']","[name='zip']","[name='zip_code']","[name='zipCode']",
        "[name='postal_code']","[name='postalCode']","[name='post_no']","[name='yubin_bango']",
        "[id='zip_cd']","[id='zipCd']","[id='zip']","[id='zip_code']","[id='postal_code']","[id='postalCode']",
        "[placeholder*='郵便番号']","[placeholder*='〒']"
      ]
    },
    {
      storageKey: "prefecture",
      selectors: [
        "[name='prefecture']","[name='pref']","[name='pref_cd']","[name='prefCd']",
        "[name='ken']","[name='todofuken']","[name='living_pref']","[name='address_pref']",
        "[id='prefecture']","[id='pref']","[id='pref_cd']","[id='ken']","[id='todofuken']"
      ]
    },
    {
      storageKey: "address",
      selectors: [
        "[name='address']","[name='addr']","[name='address1']","[name='address_detail']",
        "[name='addressDetail']","[name='city_address']","[name='street']",
        "[name='street_address']","[name='streetAddress']","[name='jusho']",
        "[id='address']","[id='addr']","[id='address1']","[id='address_detail']","[id='street_address']",
        "[placeholder*='市区町村']","[placeholder*='番地']","[placeholder*='住所']"
      ]
    },
    {
      storageKey: "university",
      selectors: [
        "[name='university']","[name='univ']","[name='univ_name']","[name='univName']",
        "[name='school_name']","[name='schoolName']","[name='college']","[name='college_name']",
        "[name='daigaku']",
        "[id='university']","[id='univ']","[id='univ_name']","[id='school_name']","[id='college']",
        "[placeholder*='大学名']","[placeholder*='大学・大学院']"
      ]
    },
    {
      storageKey: "faculty",
      selectors: [
        "[name='faculty']","[name='gakubu']","[name='faculty_name']","[name='facultyName']",
        "[name='school_faculty']",
        "[id='faculty']","[id='gakubu']","[id='faculty_name']",
        "[placeholder*='学部']","[placeholder*='学部名']"
      ]
    },
    {
      storageKey: "department",
      selectors: [
        "[name='department']","[name='gakka']","[name='dept_name']","[name='deptName']",
        "[name='major']","[name='major_name']","[name='course']",
        "[id='department']","[id='gakka']","[id='dept_name']","[id='major']",
        "[placeholder*='学科']","[placeholder*='専攻']","[placeholder*='コース']"
      ]
    },
    {
      storageKey: "gradYear",
      selectors: [
        "[name='grad_year']","[name='gradYear']","[name='graduation_year']","[name='graduationYear']",
        "[name='sotsugyo_year']","[name='expected_grad_year']","[name='expected_graduation_year']",
        "[id='grad_year']","[id='gradYear']","[id='graduation_year']","[id='expected_grad_year']",
        "[placeholder*='卒業予定年']","[placeholder*='卒業年']"
      ]
    },
    {
      storageKey: "gradMonth",
      selectors: [
        "[name='grad_month']","[name='gradMonth']","[name='graduation_month']","[name='graduationMonth']",
        "[name='sotsugyo_month']","[name='expected_grad_month']","[name='expected_graduation_month']",
        "[id='grad_month']","[id='gradMonth']","[id='graduation_month']","[id='expected_grad_month']",
        "[placeholder*='卒業予定月']","[placeholder*='卒業月']"
      ]
    }
  ];
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
  // フィールドマップを読み込む（同期）
  const fields = loadFieldMap();

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
