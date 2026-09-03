// ============================================================
// config.js
// Firebaseプロジェクトの接続設定。
//
// ここに書く値(apiKeyなど)はサーバーの秘密鍵とは違い、
// クライアントに公開される前提の値です。
// アクセス制御はこの値の秘匿性ではなく、Firestoreの
// セキュリティルール(Firebase Consoleで設定済み)で行っています。
// そのためこのファイルはそのままGitにコミットして構いません。
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAOF6zp7fKRkDu5XXYz-BjT-LlgBDvbJyk",
  authDomain: "kaken-web-matome.firebaseapp.com",
  projectId: "kaken-web-matome",
  storageBucket: "kaken-web-matome.firebasestorage.app",
  messagingSenderId: "750311376581",
  appId: "1:750311376581:web:137183d13ba57fb60392ac",
};
