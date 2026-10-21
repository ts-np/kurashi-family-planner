# 暮らしの支度帖 — GitHub Pages / Firebase 移行版

家具・家電・雑貨の購入リスト、商品候補のリンク・コメント、期限、予算、編集可能な場所を家族で管理します。GoogleログインとFirestoreによる共有保存に対応する移行用ソースです。Firebaseの設定・認証・実サービスでの検証は未完了です。

## 公開前の接続・設定

1. 所有者のGitHubとFirebaseを接続する。FirebaseプロジェクトとWebアプリを作成する（既存プロジェクトがある場合は用途を確認）。料金プラン変更・課金有効化は自動で行わない。
2. Firebase AuthenticationでGoogleを有効化。Firestoreを作成。Webアプリの公開設定を `web/firebase-config.js` に設定する。サービスアカウント秘密鍵は保存・公開しない。
3. Firebase管理コンソールまたはAdmin権限の操作で、`members/{メールアドレス}` に `{enabled: true}` を登録する。予定の家族はチャット内で指定された3人。メール一覧を公開リポジトリの設定ファイルに含める必要はない。クライアントによるメンバー追加はルールで禁止。
4. `firestore.rules` を本番へ適用。未認証・未許可・偽装プロバイダのアクセス拒否、家族の読み書き、古いrevision・削除・自己メンバー追加の拒否をFirebase Emulatorで検証する。
5. GitHubに専用リポジトリを作り、Pagesの公開元をGitHub Actionsにする。`main` のワークフローが `web/` のみ公開する。GitHub Pagesの公開条件は利用プランで確認する。画面のコードは公開され得るが購入データ・会員名簿はFirestore側で保護する。
6. Pagesで割り当てられたホスト名をFirebase AuthenticationのAuthorized domainsに追加する。Google OAuthの設定に必要なドメインも確認する。
7. 本番で家族それぞれのGoogleログイン、スマホのポップアップ許可、共有保存・更新・ログアウト・未許可アカウントの拒否を確認する。

## 既存データの移行

- Sites版は https://kurashi-renovation-notebook.choicegrebe128.chatgpt.site のまま維持する。
- Sites版の「バックアップ」で最新JSONをダウンロード（購入データをリポジトリに追加しない）。
- 新版で所有者がログインし「Sites版のバックアップを読み込む」を選択。既に共有リストがある場合は「読み込み」で取り込める（置換前に確認あり）。
- アイテム数、場所、予算、期限、候補リンクとコメントを照合。家族の別端末から同じ内容が見えることを確認して移行完了とする。
- 移行の間はSites版での編集を止める。新旧DBは自動同期しない。旧版の削除・アクセス変更は別途指示があるまで行わない。

## ローカル確認

`node --test tests/model.test.js` はバックアップ互換・入力検証・更新衝突のモデルを検証。`node scripts/check-config.js` は未設定の公開をブロックする。ローカルHTTPサーバーで `web/` を配信できる。実際のGoogleログインにはFirebase設定とAuthorized domainsが必要。秘密の認証情報をチャットやコードへ貼り付けない。

## アーキテクチャ

Firestore `households/family` の `state` に購入リスト、`revision` に版番号を保存。トランザクションで版番号を照合し、同時編集の上書きを防止。`onSnapshot` で家族の変更を反映。フォーム編集中は反映を保留。ログイン後のアクセス制限をFirestoreのルールで実施する。アプリ側の画面表示だけに依存しない。
